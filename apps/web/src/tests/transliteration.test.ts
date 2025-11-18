import { transliterate, assameseSchema } from '@/hooks/useTransliterator';

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
async function runTests() {
  const schema = assameseSchema();

  // Test basic consonant
  assertEqual(transliterate('k', schema), 'ক', 'Basic consonant');

  // Test vowel
  assertEqual(transliterate('a', schema), 'আ', 'Vowel');

  // Test consonant + vowel marker
  assertEqual(transliterate('ki', schema), 'কি', 'Consonant + vowel marker');

  // Test consonant + vowel
  assertEqual(transliterate('mo.i', schema), 'মই', 'Consonant + vowel');

  // Test multiple syllables
  assertEqual(transliterate('jharru', schema), 'ঝাড়ু', 'Multiple syllables');

  // Test special character
  assertEqual(transliterate('khongg', schema), 'খং', 'Special character');

  // Test digit
  assertEqual(transliterate('5', schema), '৫', 'Digit');

  // Test mixed input
  assertEqual(transliterate('nomoskar', schema), 'নমস্কাৰ', 'Mixed input');

  // Test capital letters
  assertEqual(transliterate('oxom', schema), 'অসম', 'Capital letters');

  // Test non-Assamese words
  assertEqual(transliterate('hello!', schema), 'হেল্ল!', 'Non-Assamese words');

  // Test a full sentence
  assertEqual(transliterate('kene khobor apoonar?', schema), 'কেনে খবৰ আপোনাৰ?', 'Full sentence');
}

// Run the tests
runTests();