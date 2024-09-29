"use client";

import React, { useState, useCallback, useEffect } from "react";
import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";
import InputSection from "@/components/InputSection";
import OutputSection from "@/components/OutputSection";

const Home = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

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
    <div className="flex-grow container mx-auto p-4 flex flex-col h-[calc(100vh-150px)]">
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
  );
};

export default Home;
