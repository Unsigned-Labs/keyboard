import { TransliterationScheme } from "@/types/transliteration";

export const transliterate = (
  input: string,
  scheme: TransliterationScheme
): string => {
  let output = "";
  let i = 0;

  while (i < input.length) {
    let found = false;

    // Check for special characters
    if (scheme.specialChar[input[i] as keyof typeof scheme.specialChar]) {
      output += scheme.specialChar[input[i] as keyof typeof scheme.specialChar];
      i++;
      found = true;
    }

    // Check for consonants (up to 3 characters)
    if (!found) {
      for (let len = 3; len > 0; len--) {
        const chunk = input.slice(i, i + len);
        if (scheme.consonants[chunk as keyof typeof scheme.consonants]) {
          output += scheme.consonants[chunk as keyof typeof scheme.consonants];
          i += len;
          found = true;
          break;
        }
      }
    }

    // Check for vowels (up to 2 characters)
    if (!found) {
      for (let len = 2; len > 0; len--) {
        const chunk = input.slice(i, i + len);
        if (scheme.vowels[chunk as keyof typeof scheme.vowels]) {
          if (i === 0 || !/[a-zA-Z]/.test(input[i - 1])) {
            output += scheme.vowels[chunk as keyof typeof scheme.vowels];
          } else {
            output +=
              scheme.vowelMarks[chunk as keyof typeof scheme.vowelMarks];
          }
          i += len;
          found = true;
          break;
        }
      }
    }

    // If no match found, keep the original character
    if (!found) {
      output += input[i];
      i++;
    }
  }

  return output;
};

