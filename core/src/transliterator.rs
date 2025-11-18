use crate::types::{CharCategory, MatchResult, TransliterationSchema};

/// Main transliterator struct
pub struct Transliterator {
    schema: TransliterationSchema,
}

impl Transliterator {
    /// Creates a new Transliterator with the given schema
    pub fn new(schema: TransliterationSchema) -> Self {
        Self { schema }
    }

    /// Transliterates input text according to the schema
    pub fn transliterate(&self, input: &str) -> String {
        let mut output = String::new();
        let mut i = 0;
        let chars: Vec<char> = input.chars().collect();
        let mut previous_char_was_consonant = false;
        let mut skip_next_combination = false;
        let mut in_backticks = false;

        while i < chars.len() {
            let result = self.process_next_character(
                &chars,
                i,
                previous_char_was_consonant,
                skip_next_combination,
                in_backticks,
            );

            output.push_str(&result.output);
            i = result.new_index;
            previous_char_was_consonant = result.previous_char_was_consonant;
            skip_next_combination = result.skip_next_combination;
            in_backticks = result.in_backticks;
        }

        output
    }

    /// Gets a reference to the current schema
    pub fn get_schema(&self) -> &TransliterationSchema {
        &self.schema
    }

    /// Sets a new schema
    pub fn set_schema(&mut self, schema: TransliterationSchema) {
        self.schema = schema;
    }

    fn process_next_character(
        &self,
        chars: &[char],
        index: usize,
        previous_char_was_consonant: bool,
        skip_next_combination: bool,
        in_backticks: bool,
    ) -> ProcessResult {
        // Handle backticks for escaping
        if let Some(result) = self.handle_backticks(chars, index, in_backticks) {
            return result;
        }

        // If inside backticks, pass through character as-is
        if in_backticks {
            return ProcessResult {
                output: chars[index].to_string(),
                new_index: index + 1,
                previous_char_was_consonant,
                skip_next_combination,
                in_backticks,
            };
        }

        // Handle explicit halant (..)
        if chars[index] == '.' {
            if index + 1 < chars.len() && chars[index + 1] == '.' {
                return ProcessResult {
                    output: self.schema.exceptions.explicit_holonto.clone(),
                    new_index: index + 2,
                    previous_char_was_consonant: false,
                    skip_next_combination: false,
                    in_backticks,
                };
            }
            // Single dot - skip next combination
            return ProcessResult {
                output: String::new(),
                new_index: index + 1,
                previous_char_was_consonant,
                skip_next_combination: true,
                in_backticks,
            };
        }

        // Check for special combinations
        let remaining: String = chars[index..].iter().collect();
        for (combo, result) in &self.schema.exceptions.special_combinations {
            if remaining.starts_with(combo) {
                return ProcessResult {
                    output: result.clone(),
                    new_index: index + combo.chars().count(),
                    previous_char_was_consonant: true,
                    skip_next_combination: false,
                    in_backticks: false,
                };
            }
        }

        // Handle regular transliteration
        self.handle_regular_transliteration(
            chars,
            index,
            previous_char_was_consonant,
            skip_next_combination,
        )
    }

    fn handle_backticks(
        &self,
        chars: &[char],
        index: usize,
        in_backticks: bool,
    ) -> Option<ProcessResult> {
        // Handle escaped backtick \`
        if chars[index] == '\\' && index + 1 < chars.len() && chars[index + 1] == '`' {
            return Some(ProcessResult {
                output: "`".to_string(),
                new_index: index + 2,
                previous_char_was_consonant: false,
                skip_next_combination: false,
                in_backticks,
            });
        }

        // Toggle backtick mode
        if chars[index] == '`' {
            return Some(ProcessResult {
                output: String::new(),
                new_index: index + 1,
                previous_char_was_consonant: false,
                skip_next_combination: false,
                in_backticks: !in_backticks,
            });
        }

        None
    }

    fn handle_regular_transliteration(
        &self,
        chars: &[char],
        index: usize,
        previous_char_was_consonant: bool,
        skip_next_combination: bool,
    ) -> ProcessResult {
        let remaining: String = chars[index..].iter().collect();

        // Find the longest match
        if let Some(match_result) = self.find_longest_match(&remaining, skip_next_combination) {
            return self.process_match(
                chars,
                index,
                &match_result,
                previous_char_was_consonant,
                skip_next_combination,
            );
        }

        // No match found - pass through the character
        ProcessResult {
            output: chars[index].to_string(),
            new_index: index + 1,
            previous_char_was_consonant: false,
            skip_next_combination: false,
            in_backticks: false,
        }
    }

    fn find_longest_match(&self, input: &str, skip_next_combination: bool) -> Option<MatchResult> {
        let mut longest_match: Option<MatchResult> = None;
        let mut max_length = 0;

        // Helper function to check a category
        let check_category = |map: &std::collections::HashMap<String, Vec<String>>,
                              category: CharCategory,
                              current_max: usize| -> Option<MatchResult> {
            let mut best: Option<MatchResult> = None;
            let mut best_len = current_max;

            for (target_char, romanizations) in map {
                for romanization in romanizations {
                    if input.starts_with(romanization) {
                        let len = romanization.len();
                        if len > best_len && (!skip_next_combination || len == 1) {
                            best = Some(MatchResult {
                                matched_char: target_char.clone(),
                                matched_length: len,
                                category,
                            });
                            best_len = len;
                        }
                    }
                }
            }
            best
        };

        // Check all categories
        let categories = [
            (&self.schema.consonants, CharCategory::Consonant),
            (&self.schema.vowels, CharCategory::Vowel),
            (&self.schema.vowel_marks, CharCategory::VowelMark),
            (&self.schema.special_char, CharCategory::SpecialChar),
            (&self.schema.digits, CharCategory::Digit),
        ];

        for (map, category) in categories {
            if let Some(result) = check_category(map, category, max_length) {
                if result.matched_length > max_length {
                    max_length = result.matched_length;
                    longest_match = Some(result);
                }
            }
        }

        longest_match
    }

    fn process_match(
        &self,
        chars: &[char],
        index: usize,
        match_result: &MatchResult,
        previous_char_was_consonant: bool,
        skip_next_combination: bool,
    ) -> ProcessResult {
        let mut output = String::new();
        let mut new_previous_char_was_consonant = false;

        match match_result.category {
            CharCategory::Consonant => {
                // Add explicit halant if previous was consonant
                if previous_char_was_consonant && !skip_next_combination {
                    output.push_str(&self.schema.exceptions.explicit_holonto);
                }

                // Check if next character is a consonant for joined forms
                let next_consonant = self.find_next_consonant(chars, index + match_result.matched_length);

                if next_consonant.is_some()
                    && self.schema.exceptions.joined_consonants_before.contains_key(&match_result.matched_char) {
                    output.push_str(&self.schema.exceptions.joined_consonants_before[&match_result.matched_char]);
                } else {
                    output.push_str(&match_result.matched_char);
                }

                new_previous_char_was_consonant = true;
            }
            CharCategory::Vowel => {
                if previous_char_was_consonant && !skip_next_combination {
                    // Find corresponding vowel mark
                    let mut found_mark = false;
                    for (vowel_mark, romanizations) in &self.schema.vowel_marks {
                        if let Some(first_rom) = self.schema.vowels.get(&match_result.matched_char).and_then(|v| v.first()) {
                            if romanizations.contains(first_rom) {
                                output.push_str(vowel_mark);
                                found_mark = true;
                                break;
                            }
                        }
                    }
                    if !found_mark {
                        output.push_str(&match_result.matched_char);
                    }
                } else {
                    output.push_str(&match_result.matched_char);
                }
            }
            _ => {
                output.push_str(&match_result.matched_char);
            }
        }

        // Check for joined consonants after
        let romanization: String = chars[index..index + match_result.matched_length].iter().collect();
        if previous_char_was_consonant
            && self.schema.exceptions.joined_consonants_after.contains_key(&romanization) {
            output = format!(
                "{}{}",
                self.schema.exceptions.explicit_holonto,
                self.schema.exceptions.joined_consonants_after[&romanization]
            );
            new_previous_char_was_consonant = true;
        }

        ProcessResult {
            output,
            new_index: index + match_result.matched_length,
            previous_char_was_consonant: new_previous_char_was_consonant,
            skip_next_combination: false,
            in_backticks: false,
        }
    }

    fn find_next_consonant(&self, chars: &[char], start_index: usize) -> Option<String> {
        for i in start_index..chars.len() {
            let remaining: String = chars[i..].iter().collect();
            if let Some(match_result) = self.find_longest_match(&remaining, false) {
                if match_result.category == CharCategory::Consonant {
                    return Some(match_result.matched_char);
                }
                // If we matched something that's not a consonant, stop searching
                break;
            }
        }
        None
    }
}

/// Result of processing a character
struct ProcessResult {
    output: String,
    new_index: usize,
    previous_char_was_consonant: bool,
    skip_next_combination: bool,
    in_backticks: bool,
}

/// Standalone function to transliterate with a schema
pub fn transliterate(input: &str, schema: &TransliterationSchema) -> String {
    let t = Transliterator::new(schema.clone());
    t.transliterate(input)
}
