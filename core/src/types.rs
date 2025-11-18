use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a complete transliteration schema for a language
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransliterationSchema {
    /// Mapping of consonants to their romanization variants
    pub consonants: HashMap<String, Vec<String>>,
    /// Mapping of vowels to their romanization variants
    pub vowels: HashMap<String, Vec<String>>,
    /// Mapping of vowel marks (matras) to their romanization variants
    pub vowel_marks: HashMap<String, Vec<String>>,
    /// Special characters (punctuation, etc.)
    pub special_char: HashMap<String, Vec<String>>,
    /// Digit mappings
    pub digits: HashMap<String, Vec<String>>,
    /// Exception handling rules
    pub exceptions: Exceptions,
}

/// Special exception rules for transliteration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Exceptions {
    /// Special character combinations that need custom handling
    pub special_combinations: HashMap<String, String>,
    /// Consonant forms when followed by another consonant
    pub joined_consonants_before: HashMap<String, String>,
    /// Consonant forms when preceded by another consonant
    pub joined_consonants_after: HashMap<String, String>,
    /// The halant/virama character (explicit consonant ending)
    pub explicit_holonto: String,
}

impl TransliterationSchema {
    /// Creates a new empty schema
    pub fn new() -> Self {
        Self {
            consonants: HashMap::new(),
            vowels: HashMap::new(),
            vowel_marks: HashMap::new(),
            special_char: HashMap::new(),
            digits: HashMap::new(),
            exceptions: Exceptions {
                special_combinations: HashMap::new(),
                joined_consonants_before: HashMap::new(),
                joined_consonants_after: HashMap::new(),
                explicit_holonto: String::new(),
            },
        }
    }
}

impl Default for TransliterationSchema {
    fn default() -> Self {
        Self::new()
    }
}

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
