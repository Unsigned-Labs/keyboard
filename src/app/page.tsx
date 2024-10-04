"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { transliterate } from "@/utils/transliteration";
import { assameseSchema } from "@/utils/assameseSchema";
import InputSection from "@/components/InputSection";

const Home = () => {
  const [input, setInput] = useState("");
  const [transliteratedOutput, setTransliteratedOutput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateTransliteration = useCallback((value: string) => {
    const transliterated = transliterate(value, assameseSchema);
    setTransliteratedOutput(transliterated);
  }, []);

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

  useEffect(() => {
    if (textareaRef.current) {
      const len = input.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [input]);

  return (
    <div className="flex-grow container mx-auto p-4 flex flex-col h-[calc(100vh-150px)]">
      <div className="flex-grow flex flex-col">
        <InputSection
          input={input}
          transliteratedOutput={transliteratedOutput}
          onChange={handleInputChange}
          onInputChange={handleDirectInputChange}
        />
      </div>
    </div>
  );
};

export default Home;
