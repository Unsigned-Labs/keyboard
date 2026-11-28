#!/usr/bin/env python3
"""Build the English pack from an extracted SCOWL 2020.12.07 release."""

import argparse
import json
import re
from pathlib import Path


PACK = Path(__file__).resolve().parents[1] / "modules/languages/en/dictionary.json"
SOURCE = "https://deb.debian.org/debian/pool/main/s/scowl/scowl_2020.12.07.orig.tar.gz"
INPUT_LIST = re.compile(r"(?:english|american|british)(?:-words|-contractions)\.(\d+)")
WORD = re.compile(r"[a-z]+(?:'[a-z]+)*")


def build(source: Path, output: Path) -> None:
    if (source / "VERSION").read_text().strip() != "2020.12.07":
        raise ValueError("SCOWL 2020.12.07 is required")
    words = {}
    for path in sorted((source / "final").iterdir()):
        match = INPUT_LIST.fullmatch(path.name)
        if not match or int(match[1]) > 60:
            continue
        weight = 61 - int(match[1])  # Sizes reflect commonness tiers, not corpus counts.
        for word in path.read_text(encoding="latin-1").splitlines():
            word = word.lower()
            if WORD.fullmatch(word):
                words[word] = max(weight, words.get(word, 0))
    if not words:
        raise ValueError("SCOWL word lists are missing")
    notice = (source / "Copyright").read_text(encoding="utf-8")
    pack = {
        "format_version": 1,
        "language": {"tag": "en", "script": "Latn", "name": "English", "native_name": "English"},
        "resource": {
            "id": "in.unsigned.dictionary.en",
            "kind": "dictionary",
            "version": "1.0.0",
            "engine": {"abi": 1, "minimum_runtime_version": "0.1.0"},
            "license": "LicenseRef-SCOWL-2020.12.07",
            "attribution": (
                "Derived from SCOWL 2020.12.07; English, US and UK word/contraction lists through "
                f"size 60, lowercased, ASCII-filtered and weighted by size. Source: {SOURCE}\n\n{notice}"
            ),
        },
        "dictionary": {"words": dict(sorted(words.items()))},
    }
    output.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(words)} entries -> {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("extracted_scowl", type=Path)
    parser.add_argument("--output", default=PACK, type=Path)
    args = parser.parse_args()
    build(args.extracted_scowl, args.output)
