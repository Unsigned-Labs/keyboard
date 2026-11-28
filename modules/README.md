# Language packs

Packs bundled with the apps. See [docs/language-packs.md](../docs/language-packs.md) for the format.

```text
modules/
├── layouts/qwerty/layout.json            language-neutral QWERTY (Latin input)
└── languages/<tag>/
    ├── transliteration.json              Latin → script rules
    ├── dictionary.json                   word counts (CC BY-SA 4.0, from Wikipedia)
    ├── layout-*.json                     native-script layouts
    └── input-*.json                      input methods shown on the 🌐 key
```

Every file here is loaded and checked by `cargo test` in `core/`. Rebuild a dictionary with
`tools/build-dictionary.py <tag> <wikipedia dump .xml.bz2>`.
