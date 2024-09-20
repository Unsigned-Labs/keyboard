export type TransliterationScheme = {
  isDefault: boolean;
  name: string;
  consonants: { [key: string]: string };
  vowels: { [key: string]: string };
  vowelMarks: { [key: string]: string };
  specialChar: { [key: string]: string };
};
