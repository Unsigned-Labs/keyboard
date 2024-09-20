import commonAssameseWords from "@/data/commonAssameseWords.json";
import { transliterate } from "./transliteration";
import { TransliterationScheme } from "@/types/transliteration";

const wordLists: { [key: string]: string[] } = {
  Assamese: commonAssameseWords,
  // todo: add other word lists
};

export const updateSuggestions = (value: string, schema: TransliterationScheme): string[] => {
  const transliteratedInput = transliterate(value, schema);
  const wordList = wordLists[schema.name] || [];

  const suggestionWordLimit = 5;
  
  const matchedSuggestions = wordList
    .filter((word) => word.startsWith(transliteratedInput))
    .slice(0, suggestionWordLimit);
  
  return matchedSuggestions;
};
