"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Info } from "lucide-react";
import { useTheme } from "@/components/app/shared/ThemeProvider";
import ExtensionSsDark from "@/assets/extension-ss-dark.png";
import ExtensionSsLight from "@/assets/extension-ss-light.png";
import Image from "next/image";

interface BrowserExtensionsSectionProps {
  onInstallDialogOpen: () => void;
}

const BrowserExtensionsSection: React.FC<BrowserExtensionsSectionProps> = ({
  onInstallDialogOpen,
}) => {
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "firefox">("chrome");
  const { theme } = useTheme();

  // Detect browser on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.indexOf("firefox") > -1) {
        setSelectedBrowser("firefox");
      } else {
        setSelectedBrowser("chrome");
      }
    }
  }, []);

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
                <div className="relative w-[88%] h-[88%] rounded-lg overflow-hidden bg-transparent z-10">
                  <Image
                    src={theme === "dark" ? ExtensionSsDark : ExtensionSsLight}
                    alt="Extension screenshot"
                    fill
                    className="object-contain relative"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border border-purple/20 rounded-full">
              <Globe className="w-4 h-4 text-purple" />
              <span className="text-sm text-purple font-medium">Browser Extension</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight">
              Browser Extensions
            </h2>

            {/* Browser Toggle */}
            <div className="flex gap-2 p-1 bg-muted/90 rounded-xl border border-border w-fit">
              <button
                onClick={() => setSelectedBrowser("chrome")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedBrowser === "chrome"
                    ? "bg-purple text-white shadow-lg shadow-purple/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Chrome
              </button>
              <button
                onClick={() => setSelectedBrowser("firefox")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedBrowser === "firefox"
                    ? "bg-purple text-white shadow-lg shadow-purple/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Firefox
              </button>
            </div>

            <div className="pt-3">
              <button
                onClick={onInstallDialogOpen}
                className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                aria-label="How to install from zip"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/10 text-muted-foreground font-medium">
                  <Info className="w-4 h-4" />
                </span>
                <span>How to install from zip</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href={selectedBrowser === "chrome" ? "/extension-chrome.zip" : "/extension-firefox.zip"}
                className="inline-block"
                download
              >
                <Button className="bg-purple hover:bg-purple-dark text-white px-8 py-6 text-lg rounded-xl font-medium transition-all shadow-lg shadow-purple/20 hover:shadow-purple/30">
                  <Globe className="mr-3 h-5 w-5" />
                  Download .zip
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrowserExtensionsSection;