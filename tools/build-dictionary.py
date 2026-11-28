#!/usr/bin/env python3
"""Build a dictionary pack from a Wikipedia dump.

    curl -LO https://dumps.wikimedia.org/aswiki/latest/aswiki-latest-pages-articles.xml.bz2
    tools/build-dictionary.py as aswiki-latest-pages-articles.xml.bz2 > modules/languages/as/dictionary.json

Counts every run of script letters in the dump, normalises to NFC (the form the transliteration packs
produce, e.g. য় as য + ়), drops fragments left by wiki markup and keeps the most frequent words.
"""

import bz2
import collections
import json
import re
import sys
import unicodedata

LANGUAGES = {
    "as": {
        "name": "Assamese", "native_name": "অসমীয়া", "script": "Beng", "range": "\u0980-\u09FF",
        "vowels": "অআইঈউঊঋএঐওঔ", "marks": "\u09bc\u09be-\u09cd\u09d7\u0981-\u0983",
        # Bangla র and ব-as-wa never appear in Assamese spelling.
        "reject": "\u09b0", "size": 40000,
    },
    "bn": {
        "name": "Bangla", "native_name": "বাংলা", "script": "Beng", "range": "\u0980-\u09FF",
        "vowels": "অআইঈউঊঋএঐওঔ", "marks": "\u09bc\u09be-\u09cd\u09d7\u0981-\u0983",
        "reject": "\u09f0\u09f1", "size": 50000,
    },
    "hi": {
        "name": "Hindi", "native_name": "हिन्दी", "script": "Deva", "range": "\u0900-\u097F",
        "vowels": "अआइईउऊऋएऐओऔ", "marks": "\u093c\u093e-\u094d\u0900-\u0903",
        "reject": "", "size": 50000,
    },
}

MIN_COUNT = 5
APOSTROPHES = "'’ʼ"
ASSAMESE_MARKER_TRANSLATION = str.maketrans({c: "'" for c in APOSTROPHES})


def main():
    tag, dump = sys.argv[1], sys.argv[2]
    lang = LANGUAGES[tag]
    run = f"[{lang['range']}\u200c\u200d]+"
    token = re.compile(run)
    if tag == "as":
        script = [chr(c) for c in range(0x0980, 0x0A00)]
        letters = "".join(c for c in script if unicodedata.category(c).startswith("L"))
        marks = "".join(c for c in script if unicodedata.category(c).startswith("M"))
        inner_marker = f"(?<=[{letters}{marks}])[{APOSTROPHES}](?=[{letters}])"
        token = re.compile(f"{run}(?:{inner_marker}{run})*")
    starts_with_mark = re.compile(f"^[{lang['marks']}]")
    # A nukta belongs right after a consonant; after a vowel sign it's a typo in the source.
    misplaced_nukta = re.compile("[\u09be-\u09cc\u093e-\u094c][\u09bc\u093c]")

    counts = collections.Counter()
    if dump.endswith(".json"):
        # Raw counts saved earlier as [[token, count], ...], to skip re-reading a big dump.
        counts.update(dict(json.load(open(dump, encoding="utf-8"))))
    else:
        with bz2.open(dump, "rt", encoding="utf-8", errors="ignore") as f:
            for line in f:
                counts.update(token.findall(line))

    words = collections.Counter()
    for raw, count in counts.items():
        word = unicodedata.normalize("NFC", raw.replace("\u200c", "").replace("\u200d", ""))
        if any(c in APOSTROPHES for c in word):
            if tag != "as" or not token.fullmatch(word):
                continue
            word = word.translate(ASSAMESE_MARKER_TRANSLATION)
        if not word or starts_with_mark.match(word):
            continue
        if len(word) == 1 and word not in lang["vowels"]:
            continue
        if word.endswith(("\u09cd", "\u094d")):
            continue
        if misplaced_nukta.search(word):
            continue
        if any(c in lang["reject"] for c in word):
            continue
        if any(c != "'" and unicodedata.category(c)[0] in "NP" for c in word):
            continue
        words[word] += count

    kept = [(w, c) for w, c in words.most_common(lang["size"]) if c >= MIN_COUNT]
    pack = {
        "format_version": 1,
        "language": {"tag": tag, "script": lang["script"], "name": lang["name"],
                     "native_name": lang["native_name"]},
        "resource": {
            "id": f"in.unsigned.dictionary.{tag}",
            "kind": "dictionary",
            "version": "1.0.0",
            "engine": {"abi": 1, "minimum_runtime_version": "0.1.0"},
            "license": "CC-BY-SA-4.0",
            "attribution": f"Word counts from {lang['name']} Wikipedia, CC BY-SA 4.0",
        },
        "dictionary": {"words": dict(kept)},
    }
    json.dump(pack, sys.stdout, ensure_ascii=False, separators=(",", ":"))
    sys.stdout.write("\n")
    print(f"{tag}: {len(kept)} words", file=sys.stderr)


if __name__ == "__main__":
    main()
