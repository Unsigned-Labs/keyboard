"use client";

import React from "react";
import { Heart, Github } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border py-8 mt-24">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground font-light">
          <p className="flex items-center gap-1">
            Built with{" "}
            <Heart
              className="inline-block align-text-bottom text-purple"
              size={16}
              fill="currentColor"
            />{" "}
            at{" "}
            <a
              href="https://unsigned.in"
              className="text-purple hover:text-purple-dark transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsigned Labs
            </a>
          </p>
          <span className="hidden sm:inline">•</span>
          <a
            href="https://github.com/Unsigned-Labs/keyboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={16} />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
