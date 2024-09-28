import commonAssameseWords from "@/data/commonAssameseWords.json";
import { transliterate } from "./transliteration";
import { TransliterationScheme } from "@/types/transliteration";

export const updateSuggestions = (
  value: string,
  schema: TransliterationScheme
): string[] => {
  const words = value.trim().split(/\s+/);
  const lastWord = words[words.length - 1];
  const transliteratedInput = transliterate(lastWord, schema);
  const wordList = commonAssameseWords;

  const suggestionWordLimit = 5;

  const matchedSuggestions = wordList
    .filter((word) =>
      word.toLowerCase().startsWith(transliteratedInput.toLowerCase())
    )
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
  let romanizations: string[] = [""];
  const maxCombinations = 1000;

  for (const char of word) {
    const options = getRomanizationOptions(char, schema);
    const newRomanizations: string[] = [];

    for (const option of options) {
      for (const romanization of romanizations) {
        newRomanizations.push(romanization + option);
        if (newRomanizations.length >= maxCombinations) {
          return newRomanizations;
        }
      }
    }

    romanizations = newRomanizations;
  }

  return romanizations;
};

export const getReverseSuggestions = (
  value: string,
  schema: TransliterationScheme
): string[] => {
  const words = value.trim().split(/\s+/);
  const lastWord = words[words.length - 1];
  const wordList = commonAssameseWords;
  const suggestionWordLimit = 5;

  const matchedSuggestions = wordList
    .filter((word) => {
      const romanizations = generateRomanizations(word, schema);
      return romanizations.some((rom) =>
        rom.toLowerCase().startsWith(lastWord.toLowerCase())
      );
    })
    .slice(0, suggestionWordLimit);

  return matchedSuggestions;
};
