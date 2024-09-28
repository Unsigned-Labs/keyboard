export type TransliterationScheme = {
  consonants: { [key: string]: string[] };
  vowels: { [key: string]: string[] };
  vowelMarks: { [key: string]: string[] };
  specialChar: { [key: string]: string[] };
  digits: { [key: string]: string[] };
  exceptions: {
    specialCombinations: { [key: string]: string };
    joinedConsonantsBefore: { [key: string]: string };
    joinedConsonantsAfter: { [key: string]: string };
    explicitHolonto: string;
  };
};
