import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";

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
    if (typeof request.text === 'string') {
      const transliteratedText = transliterate(request.text, assameseSchema);
      sendResponse({ transliteratedText: transliteratedText });
    } else {
      sendResponse({ transliteratedText: '' });
    }
    return true;
  }
});
