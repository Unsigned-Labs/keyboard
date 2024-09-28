/* eslint-disable @typescript-eslint/no-require-imports */
const { transliterate } = require("@/utils/transliteration");
const { assameseSchema } = require("@/utils/assameseSchema");

let isEnabled = true;
const debugMode = window.location.hostname === "localhost";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "stateChanged") {
    isEnabled = request.isEnabled;
  }
});

let debounceTimer;
let currentTransliteratedWord = "";
let modalElement = null;

function createModal() {
  modalElement = document.createElement("div");
  modalElement.style.cssText = `
    position: absolute;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px 10px;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: none;
    z-index: 10000;
  `;
  document.body.appendChild(modalElement);
}

function showModal(target, text) {
  if (!modalElement) createModal();

  const rect = target.getBoundingClientRect();
  modalElement.style.left = `${rect.left}px`;
  modalElement.style.top = `${rect.top - 30}px`; // 30px above the input
  modalElement.textContent = text;
  modalElement.style.display = "block";
}

function hideModal() {
  if (modalElement) {
    modalElement.style.display = "none";
  }
}

function handleInput(event) {
  if (!isEnabled) return;

  const target = event.target;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => processTransliteration(target), 50);
}

function processTransliteration(target) {
  const currentInput = target.value;
  const words = currentInput.split(" ");
  const lastWord = words[words.length - 1];

  if (lastWord === "") {
    currentTransliteratedWord = "";
    hideModal();
  } else {
    currentTransliteratedWord = transliterate(lastWord, assameseSchema);
    showModal(target, currentTransliteratedWord);
  }

  if (debugMode) {
    console.log("Input:", currentInput);
    console.log("Transliterated:", currentTransliteratedWord);
  }
}

function handleKeyDown(event) {
  if (!isEnabled) return;

  const target = event.target;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  if (event.key === " " && currentTransliteratedWord) {
    event.preventDefault();

    const currentValue = target.value;
    const words = currentValue.split(" ");
    words[words.length - 1] = currentTransliteratedWord;

    const newValue = words.join(" ") + " ";
    target.value = newValue;

    // Set cursor position to the end
    target.setSelectionRange(newValue.length, newValue.length);

    currentTransliteratedWord = "";
    hideModal();

    if (debugMode) {
      console.log("Replaced with:", newValue);
    }
  }
}

document.addEventListener("input", handleInput);
document.addEventListener("keydown", handleKeyDown);

// Hide modal when clicking outside of inputs
document.addEventListener("click", (event) => {
  if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
    hideModal();
  }
});

chrome.runtime.sendMessage({ action: "getState" }, (response) => {
  isEnabled = response?.isEnabled ?? true;
});
