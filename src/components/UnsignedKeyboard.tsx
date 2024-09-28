"use client";

import React, { useState, useEffect, useCallback } from "react";
import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";
import Header from "./Header";
import InputSection from "./InputSection";
import OutputSection from "./OutputSection";
import Footer from "./Footer";

const Keyboard: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const updateOutput = useCallback(() => {
    setOutput(transliterate(input, assameseSchema));
  }, [input]);

  useEffect(() => {
    updateOutput();
  }, [updateOutput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const clearInput = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="flex-grow container mx-auto p-4 flex flex-col">
        <div className="flex-grow flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <InputSection
              input={input}
              onChange={handleInputChange}
              clearInput={clearInput}
            />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col h-full">
            <OutputSection output={output} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Keyboard;
