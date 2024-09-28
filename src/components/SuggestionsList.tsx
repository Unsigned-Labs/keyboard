import React from "react";
import { Button } from "@/components/ui/button";

interface SuggestionsListProps {
  suggestions: string[];
  applySuggestion: (word: string) => void;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  applySuggestion,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((word, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => applySuggestion(word)}
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {word}
        </Button>
      ))}
    </div>
  );
};

export default SuggestionsList;
