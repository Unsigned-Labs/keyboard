"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { usePacks } from "@/hooks/usePacks";
import { candidates as candidatesFor, convertText, type Candidate } from "@/lib/packs";
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
}

const DEFAULT_INPUT_METHOD = "org.unsigned.input.as.phonetic";

const Home = () => {
  const [inputMethodId, setInputMethodId] = useState(DEFAULT_INPUT_METHOD);
  const { store, inputMethods, ready } = usePacks(inputMethodId);

  const languages: Language[] = useMemo(
    () =>
      inputMethods.map((im) => ({
        id: im.id,
        name: im.language?.name ?? im.name,
        nativeName: im.language?.native_name ?? im.name,
      })),
    [inputMethods]
  );
  const selectedLanguage = languages.find((l) => l.id === inputMethodId) ?? {
    id: inputMethodId,
    name: "Assamese",
    nativeName: "অসমীয়া",
  };

  const [input, setInput] = useState("");
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<"chrome" | "firefox">("chrome");
  const [isDesktopInstallDialogOpen, setIsDesktopInstallDialogOpen] = useState(false);
  const [isAndroidInstallDialogOpen, setIsAndroidInstallDialogOpen] = useState(false);

  const entry = inputMethods.find((im) => im.id === inputMethodId);

  const transliteratedOutput = useMemo(() => {
    if (!ready || !store || !entry) return "";
    try {
      return convertText(store, entry, input);
    } catch (err) {
      console.error("Transliteration error:", err);
      return "";
    }
  }, [ready, store, entry, input]);

  // Candidates for the word at the end of the text, while it is being typed.
  const lastWord = /\S+$/.exec(input)?.[0] ?? "";
  const suggestions: Candidate[] = useMemo(() => {
    if (!ready || !store || !lastWord || lastWord.includes("`")) return [];
    return candidatesFor(store, inputMethodId, lastWord, 8);
  }, [ready, store, inputMethodId, lastWord]);

  const pickSuggestion = useCallback(
    (text: string) => setInput((current) => current.replace(/\S+$/, text) + " "),
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  useEffect(() => {
    if (inputMethods.length && !inputMethods.some((im) => im.id === inputMethodId)) {
      setInputMethodId(inputMethods[0].id);
    }
  }, [inputMethods, inputMethodId]);

  if (!store) {
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
        onLanguageChange={(language) => setInputMethodId(language.id)}
        input={input}
        transliteratedOutput={transliteratedOutput}
        onInputChange={handleInputChange}
        onDirectInputChange={setInput}
        suggestions={suggestions}
        onPickSuggestion={pickSuggestion}
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
