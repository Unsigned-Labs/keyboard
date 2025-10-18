"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Keyboard, ChevronDown, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/app/shared/ThemeProvider";
import UnsignedLogoDark from "@/assets/unsigned-logo-dark.png";
import UnsignedLogoLight from "@/assets/unsigned-logo-light.png";
import Image from "next/image";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHowToUseOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white/30 dark:bg-black/30 backdrop-blur-md border-b border-black/10 dark:border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src={theme === "dark" ? UnsignedLogoDark : UnsignedLogoLight}
                alt="Unsigned Labs"
                width={90}
                height={20}
                className="opacity-90"
              />
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-purple" />
              </div>
            </Link>
            <div className="flex sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="text-foreground hover:text-purple hover:bg-muted"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <nav
            className={`${
              isMobileMenuOpen ? "flex" : "hidden"
            } mt-4 sm:mt-0 flex-col sm:flex sm:flex-row items-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 w-full sm:w-auto`}
          >
            {/* How to Use Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                How to Use
                <ChevronDown className={`w-3 h-3 transition-transform ${isHowToUseOpen ? "rotate-180" : ""}`} />
              </button>
              {isHowToUseOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-background/95 dark:bg-gray-900/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
                  <Link
                    href="/typing-info"
                    onClick={() => setIsHowToUseOpen(false)}
                    className="block px-4 py-3 text-sm text-muted-foreground hover:bg-purple/10 hover:text-foreground transition-colors"
                  >
                    Typing Guide
                  </Link>
                  <Link
                    href="/typing-practice"
                    onClick={() => setIsHowToUseOpen(false)}
                    className="block px-4 py-3 text-sm text-muted-foreground hover:bg-purple/10 hover:text-foreground transition-colors"
                  >
                    Typing Practice
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
            >
              Developers Docs
            </Link>

            {/* Theme Toggle */}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
