import { initSync, transliterate, assameseSchema } from "@unsigned/transliterator-wasm";
import wasmBytes from "@unsigned/transliterator-wasm/transliterator_wasm_bg.wasm";

// Initialize WASM module
let wasmInitialized = false;

try {
  initSync(wasmBytes);
  wasmInitialized = true;
  console.log("WASM module initialized");
} catch (err) {
  console.error("Failed to initialize WASM module:", err);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      sendResponse({ isEnabled: data.isEnabled });
    });
    return true;
  } else if (request.action === "toggleState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      const newState = !data.isEnabled;
      chrome.storage.sync.set({ isEnabled: newState });
      sendResponse({ isEnabled: newState });
    });
    return true;
  } else if (request.action === "transliterate") {
    if (typeof request.text === 'string' && wasmInitialized) {
      const transliteratedText = transliterate(request.text, assameseSchema());
      sendResponse({ transliteratedText: transliteratedText });
    } else {
      sendResponse({ transliteratedText: '' });
    }
    return true;
  }
});
