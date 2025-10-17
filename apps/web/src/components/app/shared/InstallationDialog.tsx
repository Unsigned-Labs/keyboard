"use client";

import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  browser: "chrome" | "firefox";
}

const InstallationDialog: React.FC<InstallationDialogProps> = ({ isOpen, onClose, browser }) => {

  const firefoxInstructions = [
    "Download the extension ZIP file using the button below",
    "Unzip the downloaded file to a location on your computer",
    "Open Firefox and navigate to about:debugging",
    'Click "This Firefox" in the left sidebar',
    'Click "Load Temporary Add-on..."',
    "Navigate to the unzipped folder and select the manifest.json file",
    "The extension should now be installed and ready to use!",
  ];

  const chromeInstructions = [
    "Download the extension ZIP file using the button below",
    "Unzip the downloaded file to a location on your computer",
    "Open Chrome and navigate to chrome://extensions",
    'Enable "Developer mode" using the toggle in the top right corner',
    'Click "Load unpacked" in the top left corner',
    "Navigate to and select the unzipped folder",
    "The extension should now be installed and ready to use!",
  ];

  const instructions = browser === "firefox" ? firefoxInstructions : chromeInstructions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Manual Installation Instructions
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Download Button */}
          <div className="flex justify-center">
            <a
              href={browser === "firefox" ? "/extension-firefox.zip" : "/extension-chrome.zip"}
              className="inline-block"
            >
              <Button className="bg-purple hover:bg-purple-dark text-white px-8 py-6 text-lg rounded-xl font-medium transition-all shadow-lg shadow-purple/20 hover:shadow-purple/30">
                <Download className="mr-3 h-5 w-5" />
                Download {browser === "firefox" ? "Firefox" : "Chrome"} Extension
              </Button>
            </a>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Follow these steps to install the browser extension manually in developer mode:
            </p>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple/20 text-purple flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallationDialog;
