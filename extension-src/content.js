/* eslint-disable @typescript-eslint/no-require-imports */
const { transliterate } = require("@/utils/transliteration");
const { assameseSchema } = require("@/utils/assameseSchema");

let isEnabled = true;

// Listen for state changes from the background script
// eslint-disable-next-line @typescript-eslint/no-unused-vars
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "stateChanged") {
    isEnabled = request.isEnabled;
  }
});

// Utility functions for character checks
function isVowel(char) {
  return Object.values(assameseSchema.vowels)
    .flat()
    .includes(char.toLowerCase());
}

function isConsonant(char) {
  return Object.values(assameseSchema.consonants)
    .flat()
    .includes(char.toLowerCase());
}

// Debounced input handler to improve transliteration efficiency
let debounceTimer;

function handleInput(event) {
  if (!isEnabled) return;

  const target = event.target;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => processTransliteration(target), 200);
}

function processTransliteration(target) {
  const cursorPosition = target.selectionStart;
  const input = target.value;
  let output = "";
  let i = 0;

  while (i < input.length) {
    let chunk = input[i];
    let nextChar = i + 1 < input.length ? input[i + 1] : "";

    // Check for compound characters (vowels or consonants)
    if (i + 1 < input.length) {
      const twoCharChunk = input.slice(i, i + 2);
      if (
        Object.values(assameseSchema.consonants)
          .flat()
          .includes(twoCharChunk) ||
        Object.values(assameseSchema.vowels).flat().includes(twoCharChunk)
      ) {
        chunk = twoCharChunk;
        nextChar = i + 2 < input.length ? input[i + 2] : "";
      }
    }

    let transliterated = transliterate(chunk, assameseSchema);

    // Handle vowel marks and combining with preceding consonants
    if (
      isVowel(chunk[0]) &&
      output.length > 0 &&
      isConsonant(output[output.length - 1])
    ) {
      const prevChar = output[output.length - 1];
      const combined = transliterate(prevChar + chunk, assameseSchema);
      if (combined.length === 1) {
        output = output.slice(0, -1) + combined;
      } else {
        output += transliterated;
      }
    } else {
      output += transliterated;
    }

    // Handle explicit holonto (virama) for joining consonants
    if (nextChar === "." && chunk !== ".") {
      output += assameseSchema.exceptions.explicitHolonto;
      i++; // Skip the dot character
    }

    i += chunk.length;
  }

  target.value = output;

  // Adjust cursor position to maintain user experience
  const newPosition = cursorPosition + (output.length - input.length);
  target.setSelectionRange(newPosition, newPosition);
}

// Attach event listener to handle input events
document.addEventListener("input", handleInput);

// Request initial state from background script
chrome.runtime.sendMessage({ action: "getState" }, (response) => {
  isEnabled = response?.isEnabled ?? true;
});
