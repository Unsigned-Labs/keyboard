"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { transliterate, assameseSchema, banglaSchema, hindiSchema, TransliterationSchema } from "@unsigned/transliterator";
import InstallationDialog from "@/components/app/shared/InstallationDialog";
import HeroSection from "@/components/app/homepage/HeroSection";
import AndroidSection from "@/components/app/homepage/AndroidSection";
import BrowserExtensionsSection from "@/components/app/homepage/BrowserExtensionsSection";

interface Language {
  id: string;
  name: string;
  nativeName: string;
  schema: TransliterationSchema;
}

const Home = () => {
  const languages: Language[] = [
    { id: "assamese", name: "Assamese", nativeName: "অসমীয়া", schema: assameseSchema },
    { id: "bangla", name: "Bangla", nativeName: "বাংলা", schema: banglaSchema },
    { id: "hindi", name: "Hindi", nativeName: "हिंदी", schema: hindiSchema },
  ];

  const [input, setInput] = useState("");
  const [transliteratedOutput, setTransliteratedOutput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "firefox">("chrome");

  const updateTransliteration = useCallback((value: string) => {
    const transliterated = transliterate(value, selectedLanguage.schema);
    setTransliteratedOutput(transliterated);
  }, [selectedLanguage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInput(newValue);
      updateTransliteration(newValue);
    }, [updateTransliteration]);

  const handleDirectInputChange = useCallback(
    (newInput: string) => {
      setInput(newInput);
      updateTransliteration(newInput);
    },
    [updateTransliteration]
  );

  // Re-transliterate when language changes
  useEffect(() => {
    if (input) {
      updateTransliteration(input);
    }
  }, [selectedLanguage, input, updateTransliteration]);

  return (
    <div className="relative">
      <InstallationDialog
        isOpen={isInstallDialogOpen}
        onClose={() => setIsInstallDialogOpen(false)}
        browser={selectedBrowser}
      />
      <HeroSection
        languages={languages}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        input={input}
        transliteratedOutput={transliteratedOutput}
        onInputChange={handleInputChange}
        onDirectInputChange={handleDirectInputChange}
      />
      {/* <AndroidSection /> */}
      <BrowserExtensionsSection onInstallDialogOpen={() => setIsInstallDialogOpen(true)} />
    </div>
  );
};

export default Home;
