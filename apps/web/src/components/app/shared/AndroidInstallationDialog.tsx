"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AndroidInstallationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AndroidInstallationDialog: React.FC<AndroidInstallationDialogProps> = ({ isOpen, onClose }) => {

  const instructions = [
    "Download the APK file using the button above",
    "Open the downloaded APK file on your Android device",
    "Allow installation from unknown sources if prompted (Settings → Security → Unknown Sources)",
    "Tap 'Install' to install the keyboard",
    "Go to Settings → System → Languages & input → Virtual keyboard",
    "Tap 'Manage keyboards' and enable 'Unsigned Keyboard'",
    "Open any app with a text field and tap the keyboard icon in the navigation bar",
    "Select 'Unsigned Keyboard' from the list"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Android Keyboard Installation Guide
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">System Requirements</h3>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>Android 7.0 (Nougat) or higher</li>
              <li>Approximately 5 MB of storage space</li>
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
                  <span className="flex-1 pt-0.5 text-sm">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="font-semibold mb-2 text-sm">Security Note</h4>
            <p className="text-sm text-muted-foreground">
              Our keyboard is open source, works completely offline, and does not collect any data. You can review the source code on our GitHub repository.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AndroidInstallationDialog;
