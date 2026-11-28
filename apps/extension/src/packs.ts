/** One entry of packs/index.json, written by scripts/build.js from the repo's modules/ folder. */
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

export const DEFAULT_INPUT_METHOD = "in.unsigned.input.as.phonetic";

let indexPromise: Promise<PackIndexEntry[]> | null = null;

export function packIndex(): Promise<PackIndexEntry[]> {
  indexPromise ??= fetch(chrome.runtime.getURL("packs/index.json")).then((r) => r.json());
  return indexPromise;
}

/** Input methods that turn typed Latin text into a script. */
export async function typingInputMethods(): Promise<PackIndexEntry[]> {
  return (await packIndex()).filter((p) => p.kind === "input_method" && p.transliteration);
}
