import React, { useState, useEffect } from "react";
import { Github, Twitter, Moon, Sun, Keyboard, ArrowUpRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import "@/styles/globals.css";
import UnsignedLogoDark from "@/assets/unsigned-logo-dark.png";
import UnsignedLogoLight from "@/assets/unsigned-logo-light.png";
import Image from "./images/ImageShim";
import { createRoot } from "react-dom/client";
import { ThemeProvider, useTheme } from "@/components/app/ThemeProvider";
import LanguageSelector from "@/components/LanguageSelector";

const PopupContent: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const languages = [
    { id: "assamese", name: "Assamese", nativeName: "অসমীয়া" },
    { id: "bangla", name: "Bangla", nativeName: "বাংলা" },
    { id: "hindi", name: "Hindi", nativeName: "हिंदी" },
  ];

  const [selectedLanguage, setSelectedLanguage] = React.useState(languages[0]);

  useEffect(() => {
    chrome.storage.sync.get("isEnabled", (data) => setIsEnabled(data.isEnabled ?? true));
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    chrome.storage.sync.set({ isEnabled: checked });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { action: "stateChanged", isEnabled: checked });
    });
  };

  return (
    <div className="w-full h-[400px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="p-6 w-full h-full flex flex-col">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src={theme === "dark" ? UnsignedLogoDark : UnsignedLogoLight}
              alt="Unsigned Labs"
              width={90}
              height={20}
              className="opacity-90"
            />
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-purple" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <a
              href="https://github.com/Unsigned-Labs/keyboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition duration-300 ease-in-out"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="https://twitter.com/UnsignedLabs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition duration-300 ease-in-out"
            >
              <Twitter className="w-6 h-6" />
            </a>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="max-w-sm mx-auto">
            <LanguageSelector
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={(lang) => setSelectedLanguage(lang)}
            />
          </div>

          <div className="flex items-center justify-center">
            <div style={{ transform: "scale(2)", transformOrigin: "center" }}>
              <Switch id="keyboard-toggle" checked={isEnabled} onCheckedChange={handleToggle} />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <a
              href="https://keyboard.unsigned.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 dark:text-purple-400 hover:text-blue-400 dark:hover:text-purple-300 transition duration-300 ease-in-out flex items-center gap-2"
            >
              Write in web editor
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </main>

        <footer className="text-gray-600 dark:text-gray-400 mt-auto">
          <p className="text-center">
            Made with 🧡 by
            <a
              href="https://unsigned.in"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 dark:text-purple-400 hover:text-blue-400 dark:hover:text-purple-300 transition duration-300 ease-in-out"
            >
              Team Unsigned
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
  return (
    <ThemeProvider>
      <PopupContent />
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
