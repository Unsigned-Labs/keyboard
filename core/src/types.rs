pub use unsigned_resource_format::{Exceptions, TransliterationSchema};

/// Category of a matched character
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CharCategory {
    Consonant,
    Vowel,
    VowelMark,
    SpecialChar,
    Digit,
}

/// Result of finding a match in the schema
#[derive(Debug, Clone)]
pub struct MatchResult {
    pub matched_char: String,
    pub matched_length: usize,
    pub category: CharCategory,
}
