"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Info } from "lucide-react";
import { useTheme } from "@/components/app/shared/ThemeProvider";
import AndroidSsDark from "@/assets/android-ss-dark.png";
import AndroidSsLight from "@/assets/android-ss-light.png";
import Image from "next/image";

interface AndroidSectionProps {
  onInstallDialogOpen: () => void;
}

const AndroidSection: React.FC<AndroidSectionProps> = ({
  onInstallDialogOpen,
}) => {
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
                <div className="relative w-[88%] h-[88%] rounded-lg overflow-hidden bg-transparent z-10">
                  <Image
                    src={theme === "dark" ? AndroidSsDark : AndroidSsLight}
                    alt="Android keyboard screenshot"
                    fill
                    className="object-contain relative"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border border-purple/20 rounded-full">
              <Smartphone className="w-4 h-4 text-purple" />
              <span className="text-sm text-purple font-medium">Android Keyboard</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight">
              Android Keyboard
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A native Android keyboard with seamless transliteration for Indian languages.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">System-wide Support</p>
                  <p className="text-sm text-muted-foreground">Works across all apps on your Android device</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">Clean & Modern Design</p>
                  <p className="text-sm text-muted-foreground">Beautiful interface with light and dark themes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium">English Mode Toggle</p>
                  <p className="text-sm text-muted-foreground">Switch between transliteration and direct English input</p>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={onInstallDialogOpen}
                className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
                aria-label="Installation instructions"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/10 text-muted-foreground font-medium">
                  <Info className="w-4 h-4" />
                </span>
                <span>Installation instructions</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href="/unsigned-keyboard.apk"
                className="inline-block"
                download
              >
                <Button className="bg-purple hover:bg-purple-dark text-white px-8 py-6 text-lg rounded-xl font-medium transition-all shadow-lg shadow-purple/20 hover:shadow-purple/30">
                  <Smartphone className="mr-3 h-5 w-5" />
                  Download APK
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AndroidSection;
