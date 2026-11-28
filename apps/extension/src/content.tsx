// Shows candidates for the word before the caret in text inputs and textareas. Space replaces the
// word with the first candidate; clicking one picks it; Escape keeps the word as typed. The engine
// runs in the background script, so pages don't load WASM or dictionaries.

import type { Candidate } from "./packs";

type Field = HTMLInputElement | HTMLTextAreaElement;

let enabled = true;
let field: Field | null = null;
let word: { start: number; end: number; text: string } | null = null;
let candidates: Candidate[] = [];
let request = 0;
let debounce: ReturnType<typeof setTimeout> | undefined;

const box = document.createElement("div");
box.setAttribute("role", "listbox");
box.style.cssText = `
  position: fixed; display: none; z-index: 2147483647; gap: 4px; padding: 4px;
  background: #fff; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.2);
  font: 15px system-ui, sans-serif; color: #111;
`;

function isTextField(el: EventTarget | null): el is Field {
  if (el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && ["text", "search", ""].includes(el.type);
}

function hide() {
  box.style.display = "none";
  candidates = [];
  word = null;
}

function wordBeforeCaret(el: Field) {
  const end = el.selectionStart ?? el.value.length;
  if (end !== el.selectionEnd) return null;
  const before = el.value.slice(0, end);
  const match = /\S+$/.exec(before);
  if (!match) return null;
  return { start: end - match[0].length, end, text: match[0] };
}

function render(el: Field) {
  box.replaceChildren(
    ...candidates.map((c, i) => {
      const item = document.createElement("span");
      item.textContent = c.text;
      item.setAttribute("role", "option");
      item.style.cssText = `padding: 2px 8px; border-radius: 4px; cursor: pointer; ${
        i === 0 ? "background: #efe7ff; font-weight: 600;" : ""
      }`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        pick(i, " ");
      });
      return item;
    })
  );
  if (!box.isConnected) document.body.appendChild(box);
  const rect = el.getBoundingClientRect();
  box.style.left = `${Math.max(4, rect.left)}px`;
  box.style.top = `${rect.top > 44 ? rect.top - 40 : rect.bottom + 4}px`;
  box.style.display = "flex";
}

function setValue(el: Field, value: string, caret: number) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.setSelectionRange(caret, caret);
  // Let frameworks that control the field see the change.
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function pick(index: number, suffix: string) {
  const el = field;
  const w = word;
  const c = candidates[index];
  if (!el || !w || !c) return;
  const value = el.value.slice(0, w.start) + c.text + suffix + el.value.slice(w.end);
  hide();
  setValue(el, value, w.start + c.text.length + suffix.length);
}

function refresh(el: Field) {
  const w = wordBeforeCaret(el);
  if (!w) return hide();
  const id = ++request;
  chrome.runtime.sendMessage({ action: "candidates", text: w.text }, (response?: { candidates: Candidate[] }) => {
    if (id !== request || chrome.runtime.lastError) return;
    field = el;
    word = w;
    candidates = response?.candidates ?? [];
    if (candidates.length) render(el);
    else hide();
  });
}

document.addEventListener("input", (event) => {
  // Our own replacement fires a plain Event without inputType; only react to typing.
  if (!enabled || !isTextField(event.target) || !(event as InputEvent).inputType) return;
  const el = event.target;
  clearTimeout(debounce);
  debounce = setTimeout(() => refresh(el), 40);
});

document.addEventListener(
  "keydown",
  (event) => {
    if (!enabled || !candidates.length || event.target !== field) return;
    if (event.key === " " && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const current = field && wordBeforeCaret(field);
      if (current && word && current.text === word.text && current.end === word.end) {
        event.preventDefault();
        pick(0, " ");
      } else {
        hide();
      }
    } else if (event.key === "Escape") {
      hide();
    }
  },
  true
);

document.addEventListener("focusout", () => hide());
document.addEventListener("click", (event) => {
  if (event.target !== field) hide();
});

chrome.runtime.onMessage.addListener((message: { action: string; isEnabled: boolean }) => {
  if (message.action === "stateChanged") {
    enabled = message.isEnabled;
    if (!enabled) hide();
  }
});

chrome.runtime.sendMessage({ action: "getState" }, (response?: { isEnabled: boolean }) => {
  enabled = response?.isEnabled ?? true;
});
