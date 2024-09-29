"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Keyboard, Puzzle, Menu, X } from "lucide-react";
import UnsignedLogoDark from "@/assets/unsigned-logo-dark.png";
import UnsignedLogoLight from "@/assets/unsigned-logo-light.png";
import Image from "next/image";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <Link href="/" className="flex flex-col items-start">
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white hover:text-orange-300 dark:hover:text-purple-300 transition-colors">
                অসমীয়া কিব’ৰ্ড
              </h1>
              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                <span className="italic text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  by
                </span>
                <Image
                  src={theme === "dark" ? UnsignedLogoDark : UnsignedLogoLight}
                  alt="Unsigned Logo"
                  width={80}
                  height={20}
                />
              </div>
            </Link>
            <div className="flex sm:hidden">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMobileMenu}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          <nav
            className={`${
              isMobileMenuOpen ? "flex" : "hidden"
            } mt-4 sm:mt-0 flex-col sm:flex sm:flex-row items-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto`}
          >
            <Link
              href="/typing-info"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Keyboard className="h-5 w-5 mr-2" />
              <span>Typing Guide</span>
            </Link>
            <Link
              href="/extension"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Puzzle className="h-5 w-5 mr-2" />
              <span>Extension</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
