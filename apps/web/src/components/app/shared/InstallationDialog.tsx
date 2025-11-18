"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InstallationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  browser: "chrome" | "firefox";
}

const InstallationDialog: React.FC<InstallationDialogProps> = ({ isOpen, onClose, browser }) => {

  const firefoxInstructions = [
    "Download the extension ZIP file from the download button above",
    "Unzip the downloaded file to a location on your computer",
    "Open Firefox and navigate to about:debugging",
    'Click "This Firefox" in the left sidebar',
    'Click "Load Temporary Add-on..."',
    "Navigate to the unzipped folder and select the manifest.json file",
    "The extension should now be installed and ready to use!",
  ];

  const chromeInstructions = [
    "Download the extension ZIP file from the download button above",
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
      <DialogContent className="bg-background border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Manual Installation Instructions
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Follow these steps to install the {browser === "firefox" ? "Firefox" : "Chrome"} extension manually in developer mode:
            </p>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-foreground">
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
