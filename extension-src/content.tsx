import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";

interface StateChangedMessage {
  action: "stateChanged";
  isEnabled: boolean;
}

type ChromeMessage = StateChangedMessage;

const ContentScript: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentTransliteratedWord, setCurrentTransliteratedWord] = useState("");
  const debugMode = window.location.hostname === "localhost";

  useEffect(() => {
    const messageListener = (message: ChromeMessage) => {
      if (message.action === "stateChanged") {
        setIsEnabled(message.isEnabled);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    chrome.runtime.sendMessage({ action: "getState" }, (response: { isEnabled: boolean } | undefined) => {
      setIsEnabled(response?.isEnabled ?? true);
    });

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);
  useEffect(() => {
    let modalElement: HTMLDivElement | null = null;
    let debounceTimer: NodeJS.Timeout;

    const createModal = () => {
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
        color: #000;
        font-family: Arial, sans-serif;
      `;
      document.body.appendChild(modalElement);
    };

    const showModal = (target: HTMLElement, text: string) => {
      if (!modalElement) createModal();
      if (!modalElement) return;

      const rect = target.getBoundingClientRect();
      modalElement.style.left = `${rect.left}px`;
      modalElement.style.top = `${rect.top - 30}px`;
      modalElement.textContent = text;
      modalElement.style.display = "block";
    };

    const hideModal = () => {
      if (modalElement) {
        modalElement.style.display = "none";
      }
    };

    const processTransliteration = (target: HTMLInputElement | HTMLTextAreaElement) => {
      const currentInput = target.value;
      const words = currentInput.split(" ");
      const lastWord = words[words.length - 1];

      if (lastWord === "") {
        setCurrentTransliteratedWord("");
        hideModal();
      } else {
        const transliteratedWord = transliterate(lastWord, assameseSchema);
        setCurrentTransliteratedWord(transliteratedWord);
        showModal(target, transliteratedWord);
      }
    };

    const handleInput = (event: Event) => {
      if (!isEnabled) return;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => processTransliteration(target), 50);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEnabled) return;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

      if (event.key === " " && currentTransliteratedWord) {
        event.preventDefault();

        const currentValue = target.value;
        const words = currentValue.split(" ");
        words[words.length - 1] = currentTransliteratedWord;

        const newValue = words.join(" ") + " ";
        target.value = newValue;

        target.setSelectionRange(newValue.length, newValue.length);

        setCurrentTransliteratedWord("");
        hideModal();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
        hideModal();
      }
    };

    document.addEventListener("input", handleInput);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("input", handleInput);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick);
      if (modalElement) {
        document.body.removeChild(modalElement);
      }
    };
  }, [isEnabled, currentTransliteratedWord, debugMode]);

  return null;
};

const root = document.createElement("div");
root.id = "extension-root";
document.body.appendChild(root);

const reactRoot = createRoot(root);
reactRoot.render(
  <React.StrictMode>
    <ContentScript />
  </React.StrictMode>
);
