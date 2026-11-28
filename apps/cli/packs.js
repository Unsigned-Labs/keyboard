// Loads language packs into a PackStore: the repo's modules/ folder, ~/.local/share/unsigned-keyboard/packs
// and any extra folders given with --packs.

const fs = require('fs');
const os = require('os');
const path = require('path');

function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  }).sort();
}

function packDirs(extra = []) {
  return [
    path.join(__dirname, '..', '..', 'modules'),
    path.join(os.homedir(), '.local', 'share', 'unsigned-keyboard', 'packs'),
    ...extra,
  ];
}

function loadPacks(store, extraDirs = [], onError = () => {}) {
  for (const file of packDirs(extraDirs).flatMap(jsonFiles)) {
    try {
      store.loadPack(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      onError(file, error);
    }
  }
}

// Input methods that transliterate typed Latin text (the ones a terminal can use).
function inputMethods(store) {
  return JSON.parse(store.list())
    .filter((p) => p.kind === 'input_method')
    .filter((p) => JSON.parse(store.missingDependencies(p.id)).length === 0)
    .map((p) => ({ id: p.id, name: p.name, pack: JSON.parse(store.packJson(p.id)) }))
    .filter((im) => im.pack.input_method.transliteration);
}

// Converts a line with each word's best candidate, and lists every word's candidates.
function convertLine(store, inputMethodId, line, limit = 6) {
  const output = store.convert(inputMethodId, line);
  const words = (line.match(/[A-Za-z]+/g) || []).map((word) => ({
    word,
    candidates: JSON.parse(store.candidates(inputMethodId, word, limit)),
  }));
  return { output, words };
}

module.exports = { loadPacks, inputMethods, convertLine, packDirs };
