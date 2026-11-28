import bz2
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

BUILDER = Path(__file__).with_name("build-dictionary.py")


class AssameseDictionaryTests(unittest.TestCase):
    def build(self, tag, data, suffix):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ("corpus" + suffix)
            path.write_bytes(data)
            pack = subprocess.run(
                [sys.executable, str(BUILDER), tag, str(path)],
                capture_output=True,
                text=True,
                check=True,
            )
        return json.loads(pack.stdout)["dictionary"]["words"]

    def test_dump_merges_internal_markers_but_not_quotation_marks(self):
        line = "'নহ’ব' ‘নহʼব’ নহ'ব 'হয়' হ’য় '\n"
        words = self.build("as", bz2.compress((line * 5).encode()), ".bz2")
        self.assertEqual(words, {"নহ'ব": 15, "হয়": 5, "হ'য়": 5})

    def test_cached_counts_require_assamese_letters_around_markers(self):
        counts = [["নহ’লে", 3], ["নহʼলে", 3], ["নহ'লে", 3], ["’নহলে", 99],
                  ["নহলেʼ", 99], ["নহ’’লে", 99], ["নহ’abc", 99], ["নহ’১", 99]]
        words = self.build("as", json.dumps(counts).encode(), ".json")
        self.assertEqual(words, {"নহ'লে": 9})

    def test_other_dictionaries_do_not_apply_assamese_markers(self):
        counts = [["নহ’লে", 20], ["নহʼলে", 20], ["নহ'লে", 20]]
        self.assertEqual(self.build("bn", json.dumps(counts).encode(), ".json"), {})


if __name__ == "__main__":
    unittest.main()
