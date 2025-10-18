import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

type Language = {
  id: string;
  name: string;
  nativeName: string;
};

interface Props {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<Props> = ({ languages, selectedLanguage, onLanguageChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = languages.filter(
    (l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

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
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full min-w-[280px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none focus:border-purple/50 transition-colors"
              />
            </div>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onLanguageChange(lang);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-purple/10 transition-colors ${selectedLanguage.id === lang.id ? "bg-purple/5" : ""}`}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">{lang.name}</div>
                    <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                  </div>
                  {selectedLanguage.id === lang.id && <Check className="w-4 h-4 text-purple" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No languages found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
