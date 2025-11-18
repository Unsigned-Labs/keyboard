"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { TransliterationSchema } from "@/hooks/useTransliterator";

interface Language {
  id: string;
  name: string;
  nativeName: string;
  schema: TransliterationSchema | null;
}

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-card/90 hover:bg-card border border-border hover:border-purple/30 rounded-xl transition-all duration-200 backdrop-blur-xl min-w-[200px]"
      >
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-foreground">{selectedLanguage.name}</div>
          <div className="text-xs text-muted-foreground">{selectedLanguage.nativeName}</div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full min-w-[280px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none focus:border-purple/50 transition-colors"
              />
            </div>
          </div>

          {/* Language list */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-purple/10 transition-colors ${
                    selectedLanguage.id === language.id ? "bg-purple/5" : ""
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">{language.name}</div>
                    <div className="text-xs text-muted-foreground">{language.nativeName}</div>
                  </div>
                  {selectedLanguage.id === language.id && (
                    <Check className="w-4 h-4 text-purple" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
