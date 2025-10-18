"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { TransliterationSchema } from "@unsigned/transliterator";
import InputSection from "@/components/app/shared/InputSection";
import LanguageSelector from "@/components/app/shared/LanguageSelector";

interface Language {
  id: string;
  name: string;
  nativeName: string;
  schema: TransliterationSchema;
}

interface HeroSectionProps {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  input: string;
  transliteratedOutput: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onDirectInputChange: (newInput: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
  input,
  transliteratedOutput,
  onInputChange,
  onDirectInputChange,
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const animatedTexts = [
    { language: "অসমীয়া", platform: "web browser" },
    { language: "বাংলা", platform: "phone" },
    { language: "हिंदी", platform: "computer" },
  ];

  // Typewriter effect for language and platform text
  useEffect(() => {
    const currentItem = animatedTexts[currentTextIndex];
    const fullText = `${currentItem.language}|${currentItem.platform}`; // Use | as separator
    const [language, platform] = fullText.split("|");

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText.length < fullText.length) {
        // Typing
        setDisplayText(fullText.slice(0, displayText.length + 1));
      } else if (!isDeleting && displayText.length === fullText.length) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText.length > 0) {
        // Deleting
        setDisplayText(fullText.slice(0, displayText.length - 1));
      } else if (isDeleting && displayText.length === 0) {
        // Move to next text
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length);
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex]);

  useEffect(() => {
    if (textareaRef.current) {
      const len = input.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [input]);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden py-20">
      {/* Enhanced background gradient blobs */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple via-purple-dark to-purple/50 rounded-full filter blur-3xl opacity-20 transform translate-x-1/3 translate-y-1/3 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-purple to-purple-dark rounded-full filter blur-3xl opacity-15 transform -translate-x-1/3 -translate-y-1/3 animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-br from-purple-dark to-purple rounded-full filter blur-3xl opacity-10 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.5s" }}></div>

      <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Hero text */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight">
                <span className="block text-foreground/95">Type</span>
                <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple via-purple-dark to-purple min-h-[1.2em]">
                  {displayText.split("|")[0]}
                  <span className="animate-pulse">|</span>
                </span>
                <span className="block text-foreground/95 mt-2">on your</span>
                <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple via-purple-dark to-purple min-h-[1.2em]">
                  {displayText.split("|")[1] || ""}
                  {displayText.includes("|") && <span className="animate-pulse">|</span>}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-light max-w-lg leading-relaxed pt-4">
                Seamlessly transliterate English to Indian languages with our intelligent typing system
              </p>
            </div>
          </div>

          {/* Right side - Input area */}
          <div className="relative space-y-4">
            <div className="flex justify-end">
              <LanguageSelector
                languages={languages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />
            </div>
            <InputSection
              input={input}
              transliteratedOutput={transliteratedOutput}
              onChange={onInputChange}
              onInputChange={onDirectInputChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;