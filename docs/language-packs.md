# Language packs

The keyboard engine knows no language. Everything a language needs comes from packs: small JSON
files that hold data only, never code. The app ships with a set of packs (the `modules/` folder of
this repo) and users can add more from files on their device.

## Pack kinds

| Kind | What it holds | Status |
| --- | --- | --- |
| `transliteration` | Rules that turn Latin keystrokes into a script (`kemon` → `কেমন`) | Supported |
| `keyboard_layout` | Keys, pages, widths and what each key types | Supported |
| `input_method` | A named combination of one layout and, optionally, one transliteration | Supported |
| `dictionary` | Words and how common they are, for ranking and completing words | Supported |
| `speech_to_text` | A local voice model | Planned |

An input method is what the user picks on the 🌐 key. The bundled ones:

| Input method | Layout | Transliteration | Dictionary |
| --- | --- | --- | --- |
| অসমীয়া (ফ'নেটিক) | QWERTY | Assamese | Assamese, 40k words |
| অসমীয়া (বৰ্ণমালা) | Assamese letters | none | none |
| हिन्दी (फ़ोनेटिक) | QWERTY | Hindi | Hindi, 50k words |
| বাংলা (ফোনেটিক) | QWERTY | Bangla | Bangla, 50k words |
| English | QWERTY | none | none |

A custom scheme is just another transliteration pack plus an input method that points at it.

## Common header

```json
{
  "format_version": 1,
  "language": { "tag": "as", "script": "Beng", "name": "Assamese", "native_name": "অসমীয়া" },
  "resource": {
    "id": "in.unsigned.transliteration.as",
    "kind": "transliteration",
    "version": "1.0.0",
    "engine": { "abi": 1, "minimum_runtime_version": "0.1.0" },
    "license": "MIT",
    "attribution": "Unsigned Labs"
  }
}
```

- `resource.id` never changes between releases. Loading a pack with an id that is already loaded
  replaces it only when its `version` is the same or newer.
- `engine.abi` is the behaviour contract for the kind. The app refuses a pack whose ABI it doesn't
  implement instead of guessing.
- `language` is optional for language-neutral layouts such as QWERTY.

## Keyboard layouts

```json
"layout": {
  "name": "অসমীয়া বৰ্ণমালা",
  "input": "direct",
  "composition": { "consonants": ["ক", "খ", "…"] },
  "pages": [
    { "id": "main", "rows": [
      { "keys": [ { "output": "আ", "after_consonant": "া" }, { "output": "ক" } ] },
      { "keys": [ { "label": "১/২", "action": "page", "target": "more", "width": 1.5 } ] }
    ] }
  ]
}
```

- `input: latin` keys type Latin letters, which the input method's transliteration converts.
  `input: direct` keys type their output as is.
- Key fields: `label` (defaults to `output`), `output`, `shift` (`{label, output}`; Latin keys
  default to upper case), `after_consonant` (typed instead of `output` right after one of
  `composition.consonants`, so `আ` becomes the sign `া`), `long_press` (the first entry is typed on
  a long press), `width` in key units, `action` and `target`.
- Actions: `shift`, `delete`, `enter`, `space`, `page` (to `target`), `symbols` (the app's own
  numbers and symbols pages) and `next_input_method`.
- Rows are centred; every key on a page shares one key unit, sized so the widest row fits.

## Input methods

```json
"input_method": {
  "name": "অসমীয়া (ফ'নেটিক)",
  "short_label": "অ",
  "layout": "in.unsigned.layout.qwerty",
  "transliteration": "in.unsigned.transliteration.as"
}
```

Keys whose characters all appear in the transliteration's inputs are composed and transliterated;
anything else (punctuation the scheme doesn't use) is typed directly.

## Dictionaries

```json
"dictionary": { "words": { "আৰু": 368570, "কৰা": 155465, "নদী": 2310 } }
```

Word → how often it was seen; only the ratios matter. Words are in NFC, the form the
transliteration packs produce (য় is য + ়). The bundled ones are counted from Wikipedia dumps with
`tools/build-dictionary.py` and are CC BY-SA 4.0, unlike the MIT code.

An input method that names a dictionary gets ranked candidates for the word being typed:

1. Every reading of the input is walked with some looseness, each costing a point: lower case for
   capital spellings (`t` for ট), a single letter for doubled ones (`i` for ঈ, `n` for the anusvara
   spelt `ng`), and no inherent vowel between two consonants (`kml` for কমল). Readings no dictionary
   word starts with are dropped.
2. Readings that are dictionary words are ranked by log frequency minus two per point, so the exact
   transliteration wins unless a loose reading is a much more common word.
3. The list is: matching words, the exact transliteration if it isn't one, completions (longer
   words starting the same way, from two letters on), and the input as typed, last.

The first candidate is what space commits. Without a dictionary the list is just the exact
transliteration and the input.

## Engine API

Every platform uses the same `PackStore` (Rust core; JNI on Android, wasm on the web and in the
extension, napi for the CLI, the line protocol in `apps/linux/src/main.rs` for IBus):

- `load(json)` validates and adds a pack; `list()`, `missing_dependencies(id)`
- `transliterate(transliteration_id, text)`: the exact, deterministic transliteration
- `candidates(input_method_id, word, limit)`: ranked `{text, kind}` list as above
- `convert(input_method_id, text)`: a whole text, each word replaced by its best candidate;
  punctuation around words is kept and text between backticks stays as typed

## Validation

`crates/resource-format` parses and validates every kind, so every platform accepts and rejects the
same files. An invalid file is never installed; the error names the field (for example
`layout.pages[0].rows[2].keys[3].target`).

## Android

Assamese, Bangla and Hindi each have three typing styles in **Languages & typing styles**:

- **Phonetic**: type on QWERTY and get words in the language’s script.
- **Native script**: type letters and vowel signs on an on-screen keyboard for that script.
- **Latin letters**: use the same QWERTY layout as phonetic mode, but keep the text exactly as typed.
  For example, Assamese Latin keeps `ki kori asa tumi?` as written. This mode does not use the
  English word list or suggest script conversions.


- Bundled packs: `modules/**/*.json` are copied into the APK as `assets/packs/` at build time.
- Imported packs: Settings → Language packs → Import pack from file, or open a `.json` pack with
  the app from a file manager. The file is validated first and only then copied to the app's own
  storage (`files/packs/<id>.json`); no storage permission is needed.
- Imported packs can be removed from the same screen; a bundled pack with the same id is used again.

## Other platforms

- Web (`apps/web`): `npm run dev`/`build` copy the packs to `public/packs/` with an `index.json`;
  the page fetches only the chosen input method and what it depends on.
- Extension (`apps/extension`): the build copies the packs and the engine into the extension. The
  background script holds them; pages only get a small content script that asks it for
  candidates. Space takes the first, click picks any, Escape keeps the word as typed.
- Linux (`apps/linux`): the packs are compiled into the engine binary; extra ones are read from
  `~/.local/share/unsigned-keyboard/packs` and `$UNSIGNED_KEYBOARD_PACKS`. The IBus engine shows
  candidates in a lookup table: space or Enter commits the highlighted one, 1–9 pick, arrows/Tab move.
- CLI (`apps/cli`): loads `modules/`, `~/.local/share/unsigned-keyboard/packs` and `--packs <dir>`;
  `--text "…"` converts once and exits.

## Later

A signed registry for downloading packs, autocorrect from the keys around the one pressed, learning
the user's own words, swipe typing and voice. These add pack kinds and engine features; the header
and validation above stay the same.
