"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTransliterator, TransliterationSchema } from "@/hooks/useTransliterator";
import InstallationDialog from "@/components/app/shared/InstallationDialog";
import DesktopInstallationDialog from "@/components/app/shared/DesktopInstallationDialog";
import AndroidInstallationDialog from "@/components/app/shared/AndroidInstallationDialog";
import HeroSection from "@/components/app/homepage/HeroSection";
import BrowserExtensionsSection from "@/components/app/homepage/BrowserExtensionsSection";
import DesktopSection from "@/components/app/homepage/DesktopSection";
import AndroidSection from "@/components/app/homepage/AndroidSection";

interface Language {
  id: string;
  name: string;
  nativeName: string;
  schema: TransliterationSchema | null;
}

const Home = () => {
  const { wasmReady, schemas, transliterate } = useTransliterator();

  const languages: Language[] = [
    { id: "assamese", name: "Assamese", nativeName: "অসমীয়া", schema: schemas.assamese },
    { id: "bangla", name: "Bangla", nativeName: "বাংলা", schema: schemas.bangla },
    { id: "hindi", name: "Hindi", nativeName: "हिंदी", schema: schemas.hindi },
  ];

  const [input, setInput] = useState("");
  const [transliteratedOutput, setTransliteratedOutput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({
    id: "assamese",
    name: "Assamese",
    nativeName: "অসমীয়া",
    schema: null
  });
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "firefox">("chrome");
  const [isDesktopInstallDialogOpen, setIsDesktopInstallDialogOpen] = useState(false);
  const [isAndroidInstallDialogOpen, setIsAndroidInstallDialogOpen] = useState(false);

  // Update selected language when schemas are loaded
  useEffect(() => {
    if (wasmReady && schemas.assamese && !selectedLanguage.schema) {
      setSelectedLanguage({
        id: "assamese",
        name: "Assamese",
        nativeName: "অসমীয়া",
        schema: schemas.assamese
      });
    }
  }, [wasmReady, schemas.assamese, selectedLanguage.schema]);

  const updateTransliteration = useCallback((value: string) => {
    if (!wasmReady || !selectedLanguage.schema) {
      setTransliteratedOutput("");
      return;
    }
    try {
      const transliterated = transliterate(value, selectedLanguage.schema);
      setTransliteratedOutput(transliterated);
    } catch (err) {
      console.error('Transliteration error:', err);
      setTransliteratedOutput("");
    }
  }, [selectedLanguage, wasmReady, transliterate]);

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

  if (!wasmReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transliterator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <InstallationDialog
        isOpen={isInstallDialogOpen}
        onClose={() => setIsInstallDialogOpen(false)}
        browser={selectedBrowser}
      />
      <DesktopInstallationDialog
        isOpen={isDesktopInstallDialogOpen}
        onClose={() => setIsDesktopInstallDialogOpen(false)}
      />
      <AndroidInstallationDialog
        isOpen={isAndroidInstallDialogOpen}
        onClose={() => setIsAndroidInstallDialogOpen(false)}
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
      <DesktopSection onInstallDialogOpen={() => setIsDesktopInstallDialogOpen(true)} />
      <BrowserExtensionsSection onInstallDialogOpen={(browser) => {
        setSelectedBrowser(browser);
        setIsInstallDialogOpen(true);
      }} />
      <AndroidSection onInstallDialogOpen={() => setIsAndroidInstallDialogOpen(true)} />
    </div>
  );
};

export default Home;
