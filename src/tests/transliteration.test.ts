import { transliterate } from '../utils/transliteration';
import { assameseSchema } from '../utils/assameseSchema';

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
  assertEqual(transliterate('k', assameseSchema), 'ক', 'Basic consonant');

  // Test vowel
  assertEqual(transliterate('a', assameseSchema), 'আ', 'Vowel');

  // Test consonant + vowel marker
  assertEqual(transliterate('ki', assameseSchema), 'কি', 'Consonant + vowel marker');

  // Test consonant + vowel
  assertEqual(transliterate('mo.i', assameseSchema), 'মই', 'Consonant + vowel');

  // Test multiple syllables
  assertEqual(transliterate('jharru', assameseSchema), 'ঝাড়ু', 'Multiple syllables');

  // Test special character
  assertEqual(transliterate('khongg', assameseSchema), 'খং', 'Special character');

  // Test digit
  assertEqual(transliterate('5', assameseSchema), '৫', 'Digit');

  // Test mixed input
  assertEqual(transliterate('nomoskar', assameseSchema), 'নমস্কাৰ', 'Mixed input');

  // Test capital letters
  assertEqual(transliterate('oxom', assameseSchema), 'অসম', 'Capital letters');

  // Test non-Assamese words
  assertEqual(transliterate('hello!', assameseSchema), 'হেল্ল!', 'Non-Assamese words');

  // Test a full sentence
  assertEqual(transliterate('kene khobor apoonar?', assameseSchema), 'কেনে খবৰ আপোনাৰ?', 'Full sentence');
}

// Run the tests
runTests();