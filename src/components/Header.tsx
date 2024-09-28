import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import TypingInfoDialog from "./TypingInfoDialog";
import UnsignedLogoDark from "@/assets/unsigned-logo-dark.png";
import UnsignedLogoLight from "@/assets/unsigned-logo-light.png";
import Image from "next/image";
import { Noto_Sans_Indic_Siyaq_Numbers } from "next/font/google";
import ExtensionInfoDialog from "./ExtensionInfoDialog";

const merriweather = Noto_Sans_Indic_Siyaq_Numbers({
  weight: "400",
  subsets: ["latin"],
});

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start">
            <h1
              className={`${merriweather.className} text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white`}
            >
              অসমীয়া কিব’ৰ্ড
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
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
          </div>
          <div className="flex gap-3">
            <div className="hidden sm:block">
              <ExtensionInfoDialog />
            </div>
            <TypingInfoDialog />
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
