import type { PackStore } from "@unsigned/transliterator-wasm";

/** One entry of public/packs/index.json (written by scripts/copy-assets.mjs). */
export interface PackIndexEntry {
  id: string;
  kind: "transliteration" | "keyboard_layout" | "input_method" | "dictionary";
  file: string;
  name: string;
  language: { tag: string; script: string; name: string; native_name: string } | null;
  dependencies: string[];
  transliteration: string | null;
}

export interface Candidate {
  text: string;
  kind: "word" | "transliteration" | "completion" | "latin";
}

let indexPromise: Promise<PackIndexEntry[]> | null = null;
const loaded = new Set<string>();
const loading = new Map<string, Promise<void>>();

export function packIndex(): Promise<PackIndexEntry[]> {
  indexPromise ??= fetch("/packs/index.json").then((r) => r.json());
  return indexPromise;
}

/** Input methods that turn typed Latin text into a script; the ones a physical keyboard can use. */
export async function typingInputMethods(): Promise<PackIndexEntry[]> {
  const index = await packIndex();
  return index.filter((p) => p.kind === "input_method" && p.transliteration);
}

/** Loads a pack and everything it depends on, fetching each file once. */
export async function ensurePack(store: PackStore, id: string): Promise<void> {
  if (loaded.has(id)) return;
  let pending = loading.get(id);
  if (!pending) {
    pending = (async () => {
      const entry = (await packIndex()).find((p) => p.id === id);
      if (!entry) throw new Error(`Unknown pack ${id}`);
      await Promise.all(entry.dependencies.map((dep) => ensurePack(store, dep)));
      const json = await fetch(`/packs/${entry.file}`).then((r) => r.text());
      store.loadPack(json);
      loaded.add(id);
    })();
    loading.set(id, pending);
  }
  return pending;
}

export function candidates(store: PackStore, inputMethodId: string, word: string, limit = 8): Candidate[] {
  return JSON.parse(store.candidates(inputMethodId, word, limit));
}

/** Converts typed text word by word with each word's best candidate (see PackStore::convert). */
export function convertText(store: PackStore, entry: PackIndexEntry, text: string): string {
  return store.convert(entry.id, text);
}
