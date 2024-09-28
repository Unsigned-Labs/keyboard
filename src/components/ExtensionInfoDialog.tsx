/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, PuzzleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ExtensionInfoDialog: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("firefox") > -1) {
      return "firefox";
    } else if (
      userAgent.indexOf("chrome") > -1 ||
      userAgent.indexOf("chromium") > -1
    ) {
      return "chrome";
    }
    return "unknown";
  };

  const browser = detectBrowser();

  const getInstructions = () => {
    if (browser === "firefox") {
      return (
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-left">
          <li>Download the extension ZIP file using the button below.</li>
          <li>Unzip the downloaded file to a location on your computer.</li>
          <li>
            Open Firefox and navigate to <code>about:debugging</code>.
          </li>
          <li>Click "This Firefox" in the left sidebar.</li>
          <li>Click "Load Temporary Add-on..."</li>
          <li>
            Navigate to the unzipped folder and select the{" "}
            <code>manifest.json</code> file.
          </li>
          <li>The extension should now be installed and ready to use!</li>
        </ol>
      );
    } else {
      return (
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-left">
          <li>Download the extension ZIP file using the button below.</li>
          <li>Unzip the downloaded file to a location on your computer.</li>
          <li>
            Open Chrome and navigate to <code>chrome://extensions</code>.
          </li>
          <li>
            Enable "Developer mode" using the toggle in the top right corner.
          </li>
          <li>Click "Load unpacked" in the top left corner.</li>
          <li>Navigate to and select the unzipped folder.</li>
          <li>The extension should now be installed and ready to use!</li>
        </ol>
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <PuzzleIcon className="h-5 w-5 mr-2" />
          Try our extension
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] sm:h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl mb-4 text-center">
              Install Browser Extension (Developer Mode)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 w-full text-center">
            <p className="text-gray-700 dark:text-gray-300">
              Enhance your experience with our browser extension for easier
              typing in Assamese. Follow the instructions below to install the
              extension in developer mode.
            </p>
            <div className="flex justify-center mt-6 space-x-4">
              <a
                href={
                  browser === "firefox"
                    ? "/extension-firefox.zip"
                    : "/extension-chrome.zip"
                }
                className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded transition-colors ${
                  browser === "firefox"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={() => setShowInstructions(true)}
              >
                <Download className="h-4 w-4" />
                Download for {browser === "firefox" ? "Firefox" : "Chrome"}
              </a>
            </div>
            {showInstructions && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Installation Instructions:
                </h3>
                {getInstructions()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtensionInfoDialog;
