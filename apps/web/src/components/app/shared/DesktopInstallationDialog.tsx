"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DesktopInstallationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DesktopInstallationDialog: React.FC<DesktopInstallationDialogProps> = ({ isOpen, onClose }) => {

  const instructions = [
    "Download the package using the button above",
    "Extract the archive by double-clicking on it. If that doesn't work, use: tar -xzf unsigned-keyboard-linux-1.0.0.tar.gz",
    "Navigate to the extracted folder: cd unsigned-keyboard-linux",
    "You might need to install dependencies: sudo apt install -y ibus python3-gi (Ubuntu/Debian) or sudo dnf install -y ibus python3-gobject (Fedora)",
    "Run the installation script: sudo ./install.sh",
    "Open Settings → Keyboard → Input Sources and click '+' to add input source",
    "Search for 'Assamese (Unsigned)', 'Bangla (Unsigned)', 'Hindi (Unsigned)', etc. and add it"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Linux Desktop Installation Guide
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">System Requirements</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Ubuntu 20.04+, Debian 11+, Fedora 35+, Pop!_OS 20.04+, Linux Mint 20+</li>
              <li>Other Linux distributions with IBus support</li>
              <li>Desktop Environments: GNOME, KDE Plasma, XFCE, MATE, Cinnamon</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Installation Steps</h3>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-foreground">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple/20 text-purple flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 pt-0.5 font-mono text-sm">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Usage Tips</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Use Super+Space (Windows+Space) to switch between input methods</li>
              <li>Use backticks (`) around words to keep them in English</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DesktopInstallationDialog;
