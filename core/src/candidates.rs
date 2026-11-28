//! Several spellings for what the user typed, ranked by a dictionary.
//!
//! The deterministic transliterator turns `tumi` into exactly one string. People type loosely,
//! though: lower case for retroflex letters (`t` for ট), one `i` for ঈ, no inherent vowel between
//! consonants. This module walks every reading of the input under those relaxations, keeps the
//! readings a dictionary word can still start with, and ranks the finished words by how common
//! they are. Each relaxation costs a point, so exact readings win unless a loose one is a much
//! more common word.

use std::collections::{HashMap, HashSet};

use serde::Serialize;

use crate::dictionary::Dictionary;
use crate::types::TransliterationSchema;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum CandidateKind {
    /// A dictionary word that matches the whole input.
    Word,
    /// The exact transliteration of the input.
    Transliteration,
    /// A longer dictionary word that starts like the input.
    Completion,
    /// The input as typed, for Latin-script words.
    Latin,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Candidate {
    pub text: String,
    pub kind: CandidateKind,
}

#[derive(Clone, Copy, PartialEq)]
enum Category {
    Consonant,
    Vowel,
    VowelMark,
    Other,
    Combination,
}

struct Entry {
    output: String,
    category: Category,
    /// Characters to match in the input.
    key: Vec<char>,
    /// Typed spelling in the schema, for `joined_consonants_after`.
    roman: String,
    /// 0 when the key is the schema's own spelling, 1 for a loosened one.
    cost: u32,
}

/// Precomputed lookup tables for one transliteration schema.
pub struct CandidateModel {
    entries: Vec<Entry>,
    by_first: HashMap<char, Vec<usize>>,
    vowel_marks: HashMap<String, String>,
    holonto: String,
    joined_before: HashMap<String, String>,
    joined_after: HashMap<String, String>,
}

const BEAM: usize = 96;
const MAX_COST: u32 = 4;
const COST_WEIGHT: f64 = 2.0;
const COMPLETION_PENALTY: f64 = 1.5;

type Reading = (String, u32);

fn collapse_repeats(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        if !out.ends_with(c) {
            out.push(c);
        }
    }
    out
}

impl CandidateModel {
    pub fn new(schema: &TransliterationSchema) -> Self {
        let mut entries = Vec::new();
        let mut seen = HashSet::new();
        let mut add = |output: &str, category: Category, roman: &str, entries: &mut Vec<Entry>| {
            if roman.is_empty() {
                return;
            }
            let lower = roman.to_lowercase();
            let mut keys = vec![
                (roman.to_string(), 0),
                (lower.clone(), 1),
                (collapse_repeats(&lower), 1),
            ];
            // Signs spelt with several letters (`ng` for the anusvara) are often typed with the
            // first letter only: `hain` for हैं.
            if category == Category::Other && lower.chars().count() > 1 {
                keys.push((lower.chars().take(1).collect(), 1));
            }
            for (key, cost) in keys {
                if seen.insert((output.to_string(), category as u8, key.clone())) {
                    entries.push(Entry {
                        output: output.to_string(),
                        category,
                        key: key.chars().collect(),
                        roman: roman.to_string(),
                        cost,
                    });
                }
            }
        };

        for (map, category) in [
            (&schema.consonants, Category::Consonant),
            (&schema.vowels, Category::Vowel),
            (&schema.vowel_marks, Category::VowelMark),
            (&schema.special_char, Category::Other),
            (&schema.digits, Category::Other),
        ] {
            let mut sorted: Vec<_> = map.iter().collect();
            sorted.sort();
            for (output, romans) in sorted {
                for roman in romans {
                    add(output, category, roman, &mut entries);
                }
            }
        }
        let mut combos: Vec<_> = schema.exceptions.special_combinations.iter().collect();
        combos.sort();
        for (roman, output) in combos {
            add(output, Category::Combination, roman, &mut entries);
        }

        let mut by_first: HashMap<char, Vec<usize>> = HashMap::new();
        for (i, e) in entries.iter().enumerate() {
            by_first.entry(e.key[0]).or_default().push(i);
        }

        // Same rule as the transliterator: a vowel after a consonant becomes the vowel sign whose
        // spellings include the vowel's first spelling.
        let mut marks: Vec<_> = schema.vowel_marks.iter().collect();
        marks.sort();
        let mut vowel_marks = HashMap::new();
        for (vowel, romans) in &schema.vowels {
            if let Some(first) = romans.first() {
                if let Some((mark, _)) = marks.iter().find(|(_, r)| r.contains(first)) {
                    vowel_marks.insert(vowel.clone(), (*mark).clone());
                }
            }
        }

        Self {
            entries,
            by_first,
            vowel_marks,
            holonto: schema.exceptions.explicit_holonto.clone(),
            joined_before: schema.exceptions.joined_consonants_before.clone(),
            joined_after: schema.exceptions.joined_consonants_after.clone(),
        }
    }

    fn matches(&self, raw: &[char], lower: &[char], i: usize) -> Vec<&Entry> {
        let mut firsts = vec![raw[i]];
        if lower[i] != raw[i] {
            firsts.push(lower[i]);
        }
        firsts
            .into_iter()
            .filter_map(|c| self.by_first.get(&c))
            .flatten()
            .map(|&idx| &self.entries[idx])
            .filter(|e| {
                let end = i + e.key.len();
                end <= raw.len()
                    && if e.cost == 0 {
                        raw[i..end] == e.key[..]
                    } else {
                        lower[i..end] == e.key[..]
                    }
            })
            .collect()
    }

    fn consonant_at(&self, raw: &[char], lower: &[char], i: usize) -> bool {
        i < raw.len()
            && self
                .matches(raw, lower, i)
                .iter()
                .any(|e| e.category == Category::Consonant)
    }

    /// Ways to write one matched entry, as (text, extra cost, ends in a consonant).
    fn emit(
        &self,
        e: &Entry,
        prev_consonant: bool,
        next_is_consonant: bool,
    ) -> Vec<(String, u32, bool)> {
        let mut out = Vec::new();
        match e.category {
            Category::Consonant => {
                let letter = if next_is_consonant {
                    self.joined_before.get(&e.output).unwrap_or(&e.output)
                } else {
                    &e.output
                };
                if prev_consonant {
                    if let Some(joined) = self.joined_after.get(&e.roman) {
                        out.push((format!("{}{}", self.holonto, joined), 0, true));
                    }
                    out.push((format!("{}{letter}", self.holonto), 0, true));
                    // The inherent vowel between the two consonants was left out.
                    out.push((letter.clone(), 1, true));
                } else {
                    out.push((letter.clone(), 0, true));
                }
            }
            Category::Vowel => {
                let text = match self.vowel_marks.get(&e.output) {
                    Some(mark) if prev_consonant => mark.clone(),
                    _ => e.output.clone(),
                };
                out.push((text, 0, false));
            }
            Category::VowelMark => {
                if prev_consonant {
                    out.push((e.output.clone(), 0, false));
                }
            }
            Category::Other => out.push((e.output.clone(), 0, false)),
            Category::Combination => out.push((e.output.clone(), 0, true)),
        }
        out
    }

    /// Every reading of `input` with its cost, cheapest first. With a dictionary, only readings
    /// that some dictionary word starts with are followed.
    fn readings(&self, input: &str, dictionary: Option<&Dictionary>) -> Vec<Reading> {
        let raw: Vec<char> = input.chars().collect();
        let lower: Vec<char> = raw
            .iter()
            .map(|c| c.to_lowercase().next().unwrap_or(*c))
            .collect();
        let n = raw.len();
        let mut states: Vec<HashMap<(String, bool), u32>> = vec![HashMap::new(); n + 1];
        states[0].insert((String::new(), false), 0);

        for i in 0..n {
            let mut here: Vec<((String, bool), u32)> =
                std::mem::take(&mut states[i]).into_iter().collect();
            if let Some(dict) = dictionary {
                here.retain(|((text, _), _)| text.is_empty() || dict.has_prefix(text));
            }
            here.sort_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(&b.0)));
            here.truncate(BEAM);

            let entries = self.matches(&raw, &lower, i);
            for ((text, prev_consonant), cost) in here {
                let mut push = |next: usize, piece: &str, extra: u32, consonant: bool| {
                    let total = cost + extra;
                    if total <= MAX_COST {
                        let slot = states[next]
                            .entry((format!("{text}{piece}"), consonant))
                            .or_insert(u32::MAX);
                        *slot = (*slot).min(total);
                    }
                };
                if entries.is_empty() {
                    push(i + 1, &raw[i].to_string(), 0, false);
                    continue;
                }
                for e in &entries {
                    let next = i + e.key.len();
                    let next_is_consonant = self.consonant_at(&raw, &lower, next);
                    for (piece, extra, consonant) in self.emit(e, prev_consonant, next_is_consonant)
                    {
                        push(next, &piece, e.cost + extra, consonant);
                    }
                }
            }
        }

        let mut done: HashMap<String, u32> = HashMap::new();
        for ((text, _), cost) in std::mem::take(&mut states[n]) {
            let slot = done.entry(text).or_insert(u32::MAX);
            *slot = (*slot).min(cost);
        }
        let mut done: Vec<Reading> = done.into_iter().collect();
        done.sort_by(|a, b| a.1.cmp(&b.1).then_with(|| a.0.cmp(&b.0)));
        done
    }

    /// Candidates for `input`, best first. The first candidate is what a space should commit: the
    /// best dictionary word if there is one, else the exact transliteration (`exact`).
    /// Completions follow, and the input as typed comes last.
    pub fn candidates(
        &self,
        input: &str,
        exact: &str,
        dictionary: Option<&Dictionary>,
        limit: usize,
    ) -> Vec<Candidate> {
        let mut words: Vec<(String, f64)> = Vec::new();
        let mut completions: Vec<(String, f64)> = Vec::new();

        if let Some(dict) = dictionary.filter(|d| !d.is_empty()) {
            let mut readings = self.readings(input, Some(dict));
            if !readings.iter().any(|(t, _)| t == exact) {
                readings.push((exact.to_string(), 0));
            }
            for (text, cost) in &readings {
                let penalty = COST_WEIGHT * f64::from(*cost);
                if let Some(count) = dict.count(text) {
                    words.push((text.clone(), (count as f64).ln() - penalty));
                }
                if input.chars().count() >= 2 {
                    for (word, count) in dict.completions(text, limit) {
                        let score = (count as f64).ln() - penalty - COMPLETION_PENALTY;
                        completions.push((word.to_string(), score));
                    }
                }
            }
        }

        let by_score =
            |a: &(String, f64), b: &(String, f64)| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0));
        words.sort_by(by_score);
        completions.sort_by(by_score);

        let mut out: Vec<Candidate> = Vec::new();
        let add = |text: String, kind: CandidateKind, out: &mut Vec<Candidate>| {
            if !text.is_empty() && !out.iter().any(|c| c.text == text) {
                out.push(Candidate { text, kind });
            }
        };
        for (text, _) in words {
            let kind = if text == exact {
                CandidateKind::Transliteration
            } else {
                CandidateKind::Word
            };
            add(text, kind, &mut out);
        }
        add(exact.to_string(), CandidateKind::Transliteration, &mut out);
        for (text, _) in completions {
            add(text, CandidateKind::Completion, &mut out);
        }
        out.truncate(limit.saturating_sub(1).max(1));
        add(input.to_string(), CandidateKind::Latin, &mut out);
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{assamese_schema, Transliterator};

    fn assamese(words: &[(&str, u64)]) -> (CandidateModel, Transliterator, Dictionary) {
        let schema = assamese_schema();
        let dict = Dictionary::from_words(words.iter().map(|(w, c)| (w.to_string(), *c)));
        (
            CandidateModel::new(&schema),
            Transliterator::new(schema),
            dict,
        )
    }

    fn texts(c: &[Candidate]) -> Vec<&str> {
        c.iter().map(|c| c.text.as_str()).collect()
    }

    #[test]
    fn without_a_dictionary_offers_the_transliteration_and_the_input() {
        let (model, t, _) = assamese(&[]);
        let c = model.candidates("nomoskar", &t.transliterate("nomoskar"), None, 8);
        assert_eq!(texts(&c), ["নমস্কাৰ", "nomoskar"]);
        assert_eq!(c[0].kind, CandidateKind::Transliteration);
        assert_eq!(c[1].kind, CandidateKind::Latin);
    }

    #[test]
    fn exact_dictionary_word_stays_first() {
        let (model, t, dict) = assamese(&[("কথা", 100), ("কথাবোৰ", 10)]);
        let exact = t.transliterate("kotha");
        assert_eq!(exact, "কথা");
        let c = model.candidates("kotha", &exact, Some(&dict), 8);
        assert_eq!(texts(&c), ["কথা", "কথাবোৰ", "kotha"]);
        assert_eq!(c[1].kind, CandidateKind::Completion);
    }

    #[test]
    fn loose_spelling_finds_the_dictionary_word() {
        let (model, t, dict) = assamese(&[("নদী", 100)]);
        let exact = t.transliterate("nodi");
        assert_ne!(exact, "নদী");
        let c = model.candidates("nodi", &exact, Some(&dict), 8);
        assert_eq!(c[0].text, "নদী");
        assert_eq!(c[0].kind, CandidateKind::Word);
        assert!(texts(&c).contains(&exact.as_str()));
    }

    #[test]
    fn left_out_inherent_vowel_is_found() {
        let (model, t, dict) = assamese(&[("কমল", 100)]);
        let c = model.candidates("kml", &t.transliterate("kml"), Some(&dict), 8);
        assert_eq!(c[0].text, "কমল");
    }

    #[test]
    fn multi_letter_sign_can_be_typed_with_its_first_letter() {
        let schema = crate::hindi_schema();
        let dict = Dictionary::from_words([("हैं".to_string(), 100)]);
        let t = Transliterator::new(schema.clone());
        let c = CandidateModel::new(&schema).candidates(
            "hain",
            &t.transliterate("hain"),
            Some(&dict),
            8,
        );
        assert_eq!(c[0].text, "हैं");
    }

    #[test]
    fn short_input_gets_no_completions() {
        let (model, t, dict) = assamese(&[("কথা", 100)]);
        let c = model.candidates("k", &t.transliterate("k"), Some(&dict), 8);
        assert_eq!(texts(&c), ["ক", "k"]);
    }
}
