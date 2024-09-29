"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const Footer: React.FC = () => {
  const { theme } = useTheme();

  const heartColor = theme === "dark" ? "purple" : "orange";

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-4 text-center text-gray-600 dark:text-gray-400">
      <p>
        Made with{" "}
        <Heart
          color={heartColor}
          className="inline-block align-text-bottom"
          size={16}
          fill={heartColor}
        />{" "}
        by{" "}
        <a
          href="https://unsigned.in"
          className="text-gray-600 dark:text-gray-400 no-underline hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Team Unsigned
        </a>
      </p>
    </footer>
  );
};

export default Footer;
