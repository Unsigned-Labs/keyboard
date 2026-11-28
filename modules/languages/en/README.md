# English dictionary

`dictionary.json` is derived from Kevin Atkinson and contributors’ SCOWL 2020.12.07. It includes the common English, American English and British English word and contraction lists through size 60. Entries are lowercased, filtered to ASCII letters and internal apostrophes, and weighted using `61 - size` (smaller tiers get higher weights; these are not corpus frequencies). The full upstream copyright and permission notices are included in the pack’s `resource.attribution` and must stay with redistributed copies.

Source: [SCOWL 2020.12.07](https://sourceforge.net/projects/wordlist/files/SCOWL/2020.12.07/). The [`scowl_2020.12.07.orig.tar.gz` mirror used for this build](https://deb.debian.org/debian/pool/main/s/scowl/scowl_2020.12.07.orig.tar.gz) has SHA-256 `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`.

After extracting the archive, run from the repository root:

```sh
python3 tools/build-english-dictionary.py /path/to/scowl-2020.12.07
```

Android’s English keyboard uses the bundled words offline for suggestions. Space and punctuation keep the text as typed; only tapping a suggestion replaces it. The separately selectable Android **Unsigned Keyboard spell checker** checks English and does not flag Assamese words. Apps and other selected Android spell checkers can still apply their own marks.
