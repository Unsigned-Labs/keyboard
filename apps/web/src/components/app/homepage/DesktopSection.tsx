"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Info, Download } from "lucide-react";
import { useTheme } from "@/components/app/shared/ThemeProvider";
import Image from "next/image";

interface DesktopSectionProps {
  onInstallDialogOpen: () => void;
}

const DesktopSection: React.FC<DesktopSectionProps> = ({ onInstallDialogOpen }) => {
  const { theme } = useTheme();

  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="lg:order-1 order-2 flex justify-center">
            <div className="relative group w-full max-w-[720px] h-[420px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple to-purple-dark rounded-3xl opacity-20 group-hover:opacity-30 blur-2xl transition-opacity duration-500"></div>
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-card to-card/90 backdrop-blur-xl border border-border flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple/10 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(123,104,238,0.1),transparent)]"></div>
                <div className="relative z-10 p-12 text-center space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-purple/20 flex items-center justify-center">
                    <Monitor className="w-12 h-12 text-purple" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">IBus Input Method</h3>
                    <p className="text-muted-foreground">System-wide keyboard integration</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-xs">Ubuntu</span>
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-xs">Fedora</span>
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-xs">Debian</span>
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-xs">Pop!_OS</span>
                    <span className="px-3 py-1 bg-muted/50 rounded-full text-xs">Linux Mint</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border border-purple/20 rounded-full">
              <Monitor className="w-4 h-4 text-purple" />
              <span className="text-sm text-purple font-medium">Linux Desktop</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight">
              Desktop
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Type in Indian languages across all applications with our IBus-based input method engine.
              Works seamlessly on Ubuntu, Fedora, Debian, and other major Linux distributions.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">System-Wide Support</p>
                  <p className="text-sm text-muted-foreground">Works in all applications - browsers, editors, messaging apps</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">Multiple Desktop Environments</p>
                  <p className="text-sm text-muted-foreground">GNOME, KDE Plasma, XFCE, MATE, Cinnamon</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">Easy Language Switching</p>
                  <p className="text-sm text-muted-foreground">Super+Space hotkey to switch between languages</p>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={onInstallDialogOpen}
                className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                aria-label="How to install on Linux"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/10 text-muted-foreground font-medium">
                  <Info className="w-4 h-4" />
                </span>
                <span>Installation guide</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href="/unsigned-keyboard-linux-1.0.0.tar.gz"
                className="inline-block"
                download
              >
                <Button className="bg-purple hover:bg-purple-dark text-white px-8 py-6 text-lg rounded-xl font-medium transition-all shadow-lg shadow-purple/20 hover:shadow-purple/30">
                  <Download className="mr-3 h-5 w-5" />
                  Download for Linux
                </Button>
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                <span className="font-mono">v1.0.0</span>
                <span>•</span>
                <span>248 KB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopSection;
