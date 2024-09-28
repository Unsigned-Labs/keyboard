"use client";

import React, { useState, useEffect, useCallback } from "react";
import { transliterate } from "@/utils/transliteration";
import { updateSuggestions } from "@/utils/suggestions";
import { assameseScheme } from "@/data/assameseScheme";
import Header from "./Header";
import InputSection from "./InputSection";
import OutputSection from "./OutputSection";
import SuggestionsList from "./SuggestionsList";

const Keyboard: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const updateOutput = useCallback(() => {
    setOutput(transliterate(input, assameseScheme));
  }, [input]);

  useEffect(() => {
    updateOutput();
  }, [updateOutput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    const newSuggestions = updateSuggestions(newInput, assameseScheme);
    setSuggestions(newSuggestions);
  };

  const clearInput = () => {
    setInput("");
    setSuggestions([]);
  };

  const applySuggestion = (word: string) => {
    setInput(word);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2">
            <InputSection 
              input={input} 
              onChange={handleInputChange} 
              clearInput={clearInput}
            />
            <SuggestionsList 
              suggestions={suggestions} 
              applySuggestion={applySuggestion} 
            />
          </div>
          <div className="w-full lg:w-1/2">
            <OutputSection 
              output={output} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keyboard;