"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

const AndroidSection: React.FC = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 lg:order-2 order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple/10 border border-purple/20 rounded-full">
              <Smartphone className="w-4 h-4 text-purple" />
              <span className="text-sm text-purple font-medium">Mobile App</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Android
            </h2>
            <div className="space-y-4 pt-4">
              <Button
                disabled
                className="w-full sm:w-auto bg-purple hover:bg-purple-dark text-white px-8 py-6 text-lg rounded-xl font-medium transition-all opacity-50 cursor-not-allowed shadow-lg shadow-purple/20"
              >
                <Download className="mr-3 h-5 w-5" />
                Download APK (Soon)
              </Button>
            </div>
          </div>

          <div className="relative group lg:order-1 order-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple to-purple-dark rounded-3xl opacity-20 group-hover:opacity-30 blur-2xl transition-opacity duration-500"></div>
            <div className="relative h-[400px] rounded-3xl bg-gradient-to-br from-card to-card/90 backdrop-blur-xl border border-border flex items-center justify-center overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple/10 to-transparent"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(123,104,238,0.1),transparent)]"></div>
              <div className="text-center space-y-6 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple/20 blur-3xl rounded-full"></div>
                  <Smartphone className="w-32 h-32 text-purple mx-auto opacity-40 relative" />
                </div>
                <p className="text-gray-500 text-base font-light">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AndroidSection;