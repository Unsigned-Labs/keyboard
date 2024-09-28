import { TransliterationScheme } from "@/types/transliteration";

export function transliterate(
  input: string,
  scheme: TransliterationScheme
): string {
  let output = "";
  let i = 0;
  let previousCharWasConsonant = false;
  let skipNextCombination = false;
  let inBackticks = false;

  while (i < input.length) {
    const result = processNextCharacter(
      input,
      i,
      scheme,
      previousCharWasConsonant,
      skipNextCombination,
      inBackticks
    );
    output += result.output;
    i = result.newIndex;
    previousCharWasConsonant = result.previousCharWasConsonant;
    skipNextCombination = result.skipNextCombination;
    inBackticks = result.inBackticks;
  }

  return output;
}

export function createExtensionTransliterator(scheme: TransliterationScheme) {
  let previousInput = "";
  let previousCharWasConsonant = false;
  let skipNextCombination = false;
  let inBackticks = false;

  return function (newChar: string): string {
    const input = previousInput + newChar;
    let output = "";
    let i = previousInput.length;

    while (i < input.length) {
      const result = processNextCharacter(
        input,
        i,
        scheme,
        previousCharWasConsonant,
        skipNextCombination,
        inBackticks
      );
      output += result.output;
      i = result.newIndex;
      previousCharWasConsonant = result.previousCharWasConsonant;
      skipNextCombination = result.skipNextCombination;
      inBackticks = result.inBackticks;
    }

    previousInput = input;
    return output;
  };
}

function processNextCharacter(
  input: string,
  index: number,
  scheme: TransliterationScheme,
  previousCharWasConsonant: boolean,
  skipNextCombination: boolean,
  inBackticks: boolean
): {
  output: string;
  newIndex: number;
  previousCharWasConsonant: boolean;
  skipNextCombination: boolean;
  inBackticks: boolean;
} {
  const backtickResult = handleBackticks(input, index);
  if (backtickResult) {
    return {
      ...backtickResult,
      inBackticks: backtickResult.output === "" ? !inBackticks : inBackticks,
    };
  }

  if (inBackticks) {
    return {
      output: input[index],
      newIndex: index + 1,
      previousCharWasConsonant,
      skipNextCombination,
      inBackticks,
    };
  }

  if (input[index] === ".") {
    if (input[index + 1] === ".") {
      return {
        output: scheme.exceptions.explicitHolonto,
        newIndex: index + 2,
        previousCharWasConsonant: false,
        skipNextCombination: false,
        inBackticks,
      };
    }
    return {
      output: "",
      newIndex: index + 1,
      previousCharWasConsonant,
      skipNextCombination: true,
      inBackticks,
    };
  }

  for (const [combo, result] of Object.entries(
    scheme.exceptions.specialCombinations
  )) {
    if (input.startsWith(combo, index)) {
      return {
        output: result,
        newIndex: index + combo.length,
        previousCharWasConsonant: true,
        skipNextCombination: false,
        inBackticks: false,
      };
    }
  }

  return handleRegularTransliteration(
    input,
    index,
    scheme,
    previousCharWasConsonant,
    skipNextCombination
  );
}

function handleBackticks(
  input: string,
  index: number
): {
  output: string;
  newIndex: number;
  previousCharWasConsonant: boolean;
  skipNextCombination: boolean;
  inBackticks: boolean;
} | null {
  if (
    input[index] === "\\" &&
    index + 1 < input.length &&
    input[index + 1] === "`"
  ) {
    return {
      output: "`",
      newIndex: index + 2,
      previousCharWasConsonant: false,
      skipNextCombination: false,
      inBackticks: false,
    };
  }

  if (input[index] === "`") {
    return {
      output: "",
      newIndex: index + 1,
      previousCharWasConsonant: false,
      skipNextCombination: false,
      inBackticks: false,
    };
  }

  return null;
}

function handleRegularTransliteration(
  input: string,
  index: number,
  scheme: TransliterationScheme,
  previousCharWasConsonant: boolean,
  skipNextCombination: boolean
) {
  const { longestMatch, matchedChar, matchedCategory } = findLongestMatch(
    input,
    index,
    scheme,
    skipNextCombination
  );

  if (longestMatch) {
    return processMatch(
      input,
      index,
      matchedChar,
      matchedCategory,
      scheme,
      previousCharWasConsonant,
      skipNextCombination,
      longestMatch
    );
  }

  return {
    output: input[index],
    newIndex: index + 1,
    previousCharWasConsonant: false,
    skipNextCombination: false,
    inBackticks: false,
  };
}

function findLongestMatch(
  input: string,
  index: number,
  scheme: TransliterationScheme,
  skipNextCombination: boolean
): {
  longestMatch: string;
  matchedChar: string;
  matchedCategory: keyof TransliterationScheme | null;
} {
  let longestMatch = "";
  let matchedChar = "";
  let matchedCategory: keyof TransliterationScheme | null = null;

  for (const category of [
    "consonants",
    "vowels",
    "vowelMarks",
    "specialChar",
    "digits",
  ] as const) {
    for (const [assamese, romanizations] of Object.entries(scheme[category])) {
      for (const romanization of romanizations) {
        if (
          input.startsWith(romanization, index) &&
          romanization.length > longestMatch.length &&
          (!skipNextCombination || romanization.length === 1)
        ) {
          longestMatch = romanization;
          matchedChar = assamese;
          matchedCategory = category;
        }
      }
    }
  }

  return { longestMatch, matchedChar, matchedCategory };
}

function processMatch(
  input: string,
  index: number,
  matchedChar: string,
  matchedCategory: keyof TransliterationScheme | null,
  scheme: TransliterationScheme,
  previousCharWasConsonant: boolean,
  skipNextCombination: boolean,
  longestMatch: string
) {
  let output = "";
  let newPreviousCharWasConsonant = false;

  if (matchedCategory === "consonants") {
    if (previousCharWasConsonant && !skipNextCombination) {
      output += scheme.exceptions.explicitHolonto;
    }

    const nextChar = findNextConsonant(
      input,
      index + longestMatch.length,
      scheme
    );
    if (nextChar && scheme.exceptions.joinedConsonantsBefore[matchedChar]) {
      output += scheme.exceptions.joinedConsonantsBefore[matchedChar];
    } else {
      output += matchedChar;
    }

    newPreviousCharWasConsonant = true;
  } else if (matchedCategory === "vowels") {
    if (previousCharWasConsonant && !skipNextCombination) {
      const vowelMarker = Object.entries(scheme.vowelMarks).find(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, markers]) => markers.includes(scheme.vowels[matchedChar][0])
      );
      if (vowelMarker) {
        output += vowelMarker[0];
      } else {
        output += matchedChar;
      }
    } else {
      output += matchedChar;
    }
  } else {
    output += matchedChar;
  }

  if (
    previousCharWasConsonant &&
    scheme.exceptions.joinedConsonantsAfter[longestMatch]
  ) {
    output =
      scheme.exceptions.explicitHolonto +
      scheme.exceptions.joinedConsonantsAfter[longestMatch];
    newPreviousCharWasConsonant = true;
  }

  return {
    output,
    newIndex: index + longestMatch.length,
    previousCharWasConsonant: newPreviousCharWasConsonant,
    skipNextCombination: false,
    inBackticks: false,
  };
}

function findNextConsonant(
  input: string,
  startIndex: number,
  scheme: TransliterationScheme
): string | null {
  for (let i = startIndex; i < input.length; i++) {
    const { matchedChar, matchedCategory } = findLongestMatch(
      input,
      i,
      scheme,
      false
    );
    if (matchedCategory === "consonants") {
      return matchedChar;
    }
    if (matchedCategory !== null) {
      break;
    }
  }
  return null;
}
