/* eslint-disable @typescript-eslint/no-require-imports */
const {
  transliterate,
  createExtensionTransliterator,
} = require("@/utils/transliteration");
const { assameseScheme } = require("@/data/assameseScheme");

let isEnabled = true;
let extensionTransliterate = createExtensionTransliterator(assameseScheme);

chrome.runtime.sendMessage({ action: "getState" }, (response) => {
  isEnabled = response.isEnabled;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "stateChanged") {
    isEnabled = request.isEnabled;
    extensionTransliterate = createExtensionTransliterator(assameseScheme);
  }
});

document.addEventListener("input", function (e) {
  if (!isEnabled) return;

  const target = e.target;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const text = target.value;
    const previousText = target.dataset.previousText || "";

    if (text.length > previousText.length) {
      const newChars = text.slice(previousText.length);
      let transliteratedNewChars = "";
      for (let char of newChars) {
        transliteratedNewChars += extensionTransliterate(char);
      }
      const newText = previousText + transliteratedNewChars;
      target.value = newText;
      target.setSelectionRange(newText.length, newText.length);
    } else if (text.length < previousText.length) {
      extensionTransliterate = createExtensionTransliterator(assameseScheme);
      const transliteratedText = transliterate(text, assameseScheme);
      target.value = transliteratedText;
      target.setSelectionRange(start, end);
    }

    target.dataset.previousText = target.value;
  }
});
