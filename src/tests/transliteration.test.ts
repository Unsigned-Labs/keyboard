import { transliterate } from '../utils/transliteration';
import { assameseScheme } from '../data/assameseScheme';

function assertEqual(actual: string, expected: string, testName: string) {
  if (actual === expected) {
    console.log(`✅ ${testName} passed`);
  } else {
    console.error(`❌ ${testName} failed`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
  }
}

// Test cases
function runTests() {
  // Test basic consonant
  assertEqual(transliterate('k', assameseScheme), 'ক', 'Basic consonant');

  // Test vowel
  assertEqual(transliterate('a', assameseScheme), 'আ', 'Vowel');

  // Test consonant + vowel
  assertEqual(transliterate('ka', assameseScheme), 'কা', 'Consonant + vowel');

  // Test consonant + vowel marker
  assertEqual(transliterate('ki', assameseScheme), 'কি', 'Consonant + vowel marker');

  // Test multiple syllables
  assertEqual(transliterate('bari', assameseScheme), 'বাৰি', 'Multiple syllables');

  // Test special character
  assertEqual(transliterate('ngg', assameseScheme), 'ং', 'Special character');

  // Test digit
  assertEqual(transliterate('5', assameseScheme), '৫', 'Digit');

  // Test mixed input
  assertEqual(transliterate('nomoskar', assameseScheme), 'নমস্কাৰ', 'Mixed input');

  // Test capital letters
  assertEqual(transliterate('Axom', assameseScheme), 'আছাম', 'Capital letters');

  // Test unrecognized character
  assertEqual(transliterate('hello!', assameseScheme), 'হেলো!', 'Unrecognized character');
}

// Run the tests
runTests();