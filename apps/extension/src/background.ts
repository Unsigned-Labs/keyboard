import init, { PackStore } from "@unsigned/transliterator-wasm";
import { DEFAULT_INPUT_METHOD, packIndex, type Candidate } from "./packs";

// The engine and the language packs live here, not in every page: content scripts ask for
// candidates by message. The .wasm is fetched from the extension (scripts/build.js copies it):
// bundling it as an ArrayBuffer needs `window`, which a service worker doesn't have.
const storeReady: Promise<PackStore> = init({
  module_or_path: chrome.runtime.getURL("transliterator_wasm_bg.wasm"),
}).then(() => new PackStore());
storeReady.catch((err) => console.error("Failed to initialize WASM module:", err));

const loading = new Map<string, Promise<void>>();

function ensurePack(id: string): Promise<void> {
  let pending = loading.get(id);
  if (!pending) {
    pending = (async () => {
      const store = await storeReady;
      const entry = (await packIndex()).find((p) => p.id === id);
      if (!entry) throw new Error(`Unknown pack ${id}`);
      await Promise.all(entry.dependencies.map(ensurePack));
      const json = await fetch(chrome.runtime.getURL(`packs/${entry.file}`)).then((r) => r.text());
      store.loadPack(json);
    })();
    pending.catch(() => loading.delete(id));
    loading.set(id, pending);
  }
  return pending;
}

function currentInputMethod(): Promise<string> {
  return new Promise((resolve) =>
    chrome.storage.sync.get("inputMethod", (data) => resolve(data.inputMethod || DEFAULT_INPUT_METHOD))
  );
}

async function candidates(word: string): Promise<Candidate[]> {
  const store = await storeReady;
  const inputMethod = await currentInputMethod();
  await ensurePack(inputMethod);
  return JSON.parse(store.candidates(inputMethod, word, 6));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("isEnabled", (data) => {
    if (data.isEnabled === undefined) chrome.storage.sync.set({ isEnabled: true });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      sendResponse({ isEnabled: data.isEnabled ?? true });
    });
    return true;
  } else if (request.action === "toggleState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      const newState = !data.isEnabled;
      chrome.storage.sync.set({ isEnabled: newState });
      sendResponse({ isEnabled: newState });
    });
    return true;
  } else if (request.action === "candidates" || request.action === "transliterate") {
    const word = typeof request.text === "string" ? request.text : "";
    candidates(word)
      .then((list) => sendResponse({ candidates: list, transliteratedText: list[0]?.text ?? word }))
      .catch((err) => {
        console.error(err);
        sendResponse({ candidates: [], transliteratedText: word });
      });
    return true;
  }
});
