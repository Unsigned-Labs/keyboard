const { Transliterator, hindiSchema, assameseSchema, banglaSchema, transliterateText } = require('./index.js');

console.log('Testing Transliterator bindings...\n');

// Test Hindi
console.log('=== Hindi Tests ===');
const hindiTransliterator = new Transliterator(hindiSchema());
const hindiResult = hindiTransliterator.transliterate('namaste');
console.log(`Input: "namaste"`);
console.log(`Output: "${hindiResult}"`);
console.log(`Expected: "नमस्ते"\n`);

// Test with standalone function
const hindiResult2 = transliterateText('bharat', hindiSchema());
console.log(`Input: "bharat"`);
console.log(`Output: "${hindiResult2}"`);
console.log(`Expected: "भरत"\n`);

// Test Assamese
console.log('=== Assamese Tests ===');
const assameseTransliterator = new Transliterator(assameseSchema());
const assameseResult = assameseTransliterator.transliterate('oxom');
console.log(`Input: "oxom"`);
console.log(`Output: "${assameseResult}"`);
console.log();

// Test Bangla
console.log('=== Bangla Tests ===');
const banglaTransliterator = new Transliterator(banglaSchema());
const banglaResult = banglaTransliterator.transliterate('bangla');
console.log(`Input: "bangla"`);
console.log(`Output: "${banglaResult}"`);
console.log();

console.log('✅ All tests completed!');
