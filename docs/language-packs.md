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
| `dictionary` | Words and how common they are, for suggestions and autocorrect | Planned |
| `speech_to_text` | A local voice model | Planned |

An input method is what the user picks on the 🌐 key. The bundled ones:

| Input method | Layout | Transliteration |
| --- | --- | --- |
| অসমীয়া (ফ'নেটিক) | QWERTY | Assamese |
| অসমীয়া (বৰ্ণমালা) | Assamese letters | none |
| हिन्दी (फ़ोनेटिक) | QWERTY | Hindi |
| বাংলা (ফোনেটিক) | QWERTY | Bangla |
| English | QWERTY | none |

A custom scheme is just another transliteration pack plus an input method that points at it.

## Common header

```json
{
  "format_version": 1,
  "language": { "tag": "as", "script": "Beng", "name": "Assamese", "native_name": "অসমীয়া" },
  "resource": {
    "id": "org.unsigned.transliteration.as",
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
  "layout": "org.unsigned.layout.qwerty",
  "transliteration": "org.unsigned.transliteration.as"
}
```

Keys whose characters all appear in the transliteration's inputs are composed and transliterated;
anything else (punctuation the scheme doesn't use) is typed directly.

## Validation

`crates/resource-format` parses and validates every kind, so every platform accepts and rejects the
same files. An invalid file is never installed; the error names the field (for example
`layout.pages[0].rows[2].keys[3].target`).

## Android

- Bundled packs: `modules/**/*.json` are copied into the APK as `assets/packs/` at build time.
- Imported packs: Settings → Language packs → Import pack from file, or open a `.json` pack with
  the app from a file manager. The file is validated first and only then copied to the app's own
  storage (`files/packs/<id>.json`); no storage permission is needed.
- Imported packs can be removed from the same screen; a bundled pack with the same id is used again.

## Later

A signed registry for downloading packs, dictionaries, suggestions, swipe typing and voice. These
add pack kinds and engine features; the header and validation above stay the same.
