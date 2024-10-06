import React, { useState, useEffect } from "react";
import { Edit3, Github, Twitter, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

const PopupContent: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const { theme, toggleTheme } = useTheme();

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
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="p-6 w-full min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-3xl font-extrabold hover:text-orange-300 dark:hover:text-purple-300 transition-colors">
              অসমীয়া কিব’ৰ্ড
            </h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              by <span className="font-semibold">Unsigned</span>
            </span>
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
              href="https://github.com/unsigned-labs/keyboard"
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
        </div>

        <div className="flex items-center justify-between mb-6">
          <Label
            htmlFor="keyboard-toggle"
            className={`text-lg font-medium cursor-pointer ${isEnabled ? "text-green-500" : "text-yellow-500"}`}
          >
            {isEnabled ? "Keyboard Enabled" : "Keyboard Disabled"}
          </Label>

          <Switch id="keyboard-toggle" checked={isEnabled} onCheckedChange={handleToggle} />
        </div>

        <a
          href="editor.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg text-lg transition duration-300 ease-in-out mb-6"
        >
          <Edit3 className="w-5 h-5 mr-2" />
          Open Text Editor
        </a>

        <div className="text-gray-600 dark:text-gray-400">
          <p className="flex items-center justify-center">
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
        </div>
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
