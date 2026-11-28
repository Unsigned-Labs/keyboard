// Copies the wasm engine and the repo's language packs into public/ before dev and build.
// public/packs/index.json lists every pack (id, kind, file, dependencies) so the page can fetch only
// what the chosen input method needs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.join(here, "..");
const repo = path.join(web, "..", "..");
const modules = path.join(repo, "modules");
const publicDir = path.join(web, "public");
const packsDir = path.join(publicDir, "packs");

const wasm = path.join(repo, "bindings", "wasm", "pkg", "transliterator_wasm_bg.wasm");
if (fs.existsSync(wasm)) {
  fs.copyFileSync(wasm, path.join(publicDir, "transliterator_wasm_bg.wasm"));
} else {
  console.warn("bindings/wasm/pkg is missing; run `wasm-pack build --target web --out-dir pkg` there");
}

function jsonFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith(".json") ? [full] : [];
  });
}

fs.rmSync(packsDir, { recursive: true, force: true });
fs.mkdirSync(packsDir, { recursive: true });

const index = [];
for (const file of jsonFiles(modules).sort()) {
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));
  const { id, kind } = pack.resource;
  const name = `${id}.json`;
  fs.copyFileSync(file, path.join(packsDir, name));
  const im = pack.input_method;
  index.push({
    id,
    kind,
    file: name,
    name: im?.name ?? pack.layout?.name ?? pack.language?.name ?? id,
    language: pack.language ?? null,
    dependencies: im ? [im.layout, im.transliteration, im.dictionary].filter(Boolean) : [],
    transliteration: im?.transliteration ?? null,
  });
}
fs.writeFileSync(path.join(packsDir, "index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`copied ${index.length} packs to public/packs`);
