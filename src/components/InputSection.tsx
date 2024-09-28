import React, { useState, useEffect } from "react";
import ClearButton from "./ClearButton";
import SuggestionsList from "./SuggestionsList";
import { updateSuggestions, getReverseSuggestions } from "@/utils/suggestions";
import { assameseScheme } from "@/data/assameseScheme";

interface InputSectionProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  clearInput: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
  input,
  onChange,
  clearInput,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const forwardSuggestions = updateSuggestions(input, assameseScheme);
    const reverseSuggestions = getReverseSuggestions(input, assameseScheme);
    const combinedSuggestions = [
      ...new Set([...forwardSuggestions, ...reverseSuggestions]),
    ];
    setSuggestions(combinedSuggestions.slice(0, 5));
  }, [input]);

  const applySuggestion = (word: string) => {
    const words = input.trim().split(/\s+/);
    words[words.length - 1] = word;
    const newInput = words.join(" ") + " ";
    onChange({
      target: { value: newInput },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md overflow-hidden flex flex-col">
        <textarea
          value={input}
          onChange={onChange}
          placeholder="Type in English"
          className="flex-grow w-full p-4 text-lg focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 resize-none"
        />
        {suggestions.length > 0 && (
          <div className="p-2 border-t border-gray-300 dark:border-gray-700">
            <SuggestionsList
              suggestions={suggestions}
              applySuggestion={applySuggestion}
            />
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <ClearButton onClick={clearInput} />
      </div>
    </div>
  );
};

export default InputSection;
