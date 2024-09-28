import commonAssameseWords from "@/data/commonAssameseWords.json";
import { transliterate } from "./transliteration";
import { TransliterationScheme } from "@/types/transliteration";

export const updateSuggestions = (
  value: string,
  schema: TransliterationScheme
): string[] => {
  const transliteratedInput = transliterate(value, schema);
  const wordList = commonAssameseWords;

  const suggestionWordLimit = 5;

  const matchedSuggestions = wordList
    .filter((word) => word.startsWith(transliteratedInput))
    .slice(0, suggestionWordLimit);

  return matchedSuggestions;
};

const getRomanizationOptions = (
  char: string,
  schema: TransliterationScheme
): string[] => {
  for (const category of [
    "consonants",
    "vowels",
    "vowelMarks",
    "specialChar",
    "digits",
  ] as const) {
    if (schema[category][char]) {
      return schema[category][char];
    }
  }
  return [char];
};

export const generateRomanizations = (
  word: string,
  schema: TransliterationScheme
): string[] => {
  const romanizations: string[] = [""];

  for (const char of word) {
    const options = getRomanizationOptions(char, schema);
    const newRomanizations: string[] = [];

    for (const option of options) {
      for (const romanization of romanizations) {
        newRomanizations.push(romanization + option);
      }
    }

    romanizations.splice(0, romanizations.length, ...newRomanizations);
  }

  return romanizations;
};

export const getReverseSuggestions = (
  value: string,
  schema: TransliterationScheme
): string[] => {
  const wordList = commonAssameseWords;
  const suggestionWordLimit = 5;

  const matchedSuggestions = wordList
    .filter((word) => {
      const romanizations = generateRomanizations(word, schema);
      return romanizations.some((rom) => rom.startsWith(value));
    })
    .slice(0, suggestionWordLimit);

  return matchedSuggestions;
};
