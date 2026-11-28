//! Word lookups for ranking and completing candidates.

use std::collections::HashMap;

use unsigned_resource_format::DictionaryModule;

/// Canonicalise apostrophe aliases in Assamese words without folding quotation marks.
fn assamese_word(word: &str) -> String {
    if !word.contains(['’', 'ʼ']) {
        return word.to_string();
    }

    let letter = |c: char| ('\u{0980}'..='\u{09ff}').contains(&c) && c.is_alphabetic();
    let letter_or_mark = |c: char| {
        letter(c)
            || matches!(c, '\u{0981}'..='\u{0983}' | '\u{09bc}' | '\u{09be}'..='\u{09c4}' | '\u{09c7}'..='\u{09c8}' | '\u{09cb}'..='\u{09cd}' | '\u{09d7}' | '\u{09e2}'..='\u{09e3}' | '\u{09fe}')
    };
    let mut canonical = String::with_capacity(word.len());
    let mut chars = word.chars().peekable();
    let mut previous = None;
    while let Some(c) = chars.next() {
        if matches!(c, '\'' | '’' | 'ʼ') {
            if !previous.is_some_and(letter_or_mark) || !chars.peek().copied().is_some_and(letter) {
                return word.to_string();
            }
            canonical.push('\'');
        } else if letter_or_mark(c) {
            canonical.push(c);
        } else {
            return word.to_string();
        }
        previous = Some(c);
    }
    canonical
}

/// Words sorted by text, so prefix queries are a binary search away.
pub struct Dictionary {
    words: Vec<(String, u64)>,
}

impl Dictionary {
    pub fn new(module: &DictionaryModule) -> Self {
        if module.language.tag == "as" {
            let mut words = HashMap::with_capacity(module.dictionary.words.len());
            for (word, count) in &module.dictionary.words {
                let total = words.entry(assamese_word(word)).or_insert(0_u64);
                *total = total.saturating_add(*count);
            }
            return Self::from_words(words);
        }
        Self::from_words(module.dictionary.words.iter().map(|(w, c)| (w.clone(), *c)))
    }

    pub fn from_words(words: impl IntoIterator<Item = (String, u64)>) -> Self {
        let mut words: Vec<(String, u64)> = words.into_iter().collect();
        words.sort_unstable_by(|a, b| a.0.cmp(&b.0));
        words.dedup_by(|a, b| a.0 == b.0);
        Self { words }
    }

    pub fn len(&self) -> usize {
        self.words.len()
    }

    pub fn is_empty(&self) -> bool {
        self.words.is_empty()
    }

    fn lower_bound(&self, prefix: &str) -> usize {
        self.words.partition_point(|(w, _)| w.as_str() < prefix)
    }

    pub fn count(&self, word: &str) -> Option<u64> {
        let i = self.lower_bound(word);
        self.words
            .get(i)
            .filter(|(w, _)| w == word)
            .map(|(_, c)| *c)
    }

    /// True if some word starts with `prefix` (or equals it).
    pub fn has_prefix(&self, prefix: &str) -> bool {
        self.words
            .get(self.lower_bound(prefix))
            .is_some_and(|(w, _)| w.starts_with(prefix))
    }

    /// The most frequent words longer than `prefix` that start with it.
    pub fn completions(&self, prefix: &str, limit: usize) -> Vec<(&str, u64)> {
        const MAX_SCAN: usize = 20_000;
        let mut found: Vec<(&str, u64)> = self.words[self.lower_bound(prefix)..]
            .iter()
            .take(MAX_SCAN)
            .take_while(|(w, _)| w.starts_with(prefix))
            .filter(|(w, _)| w.len() > prefix.len())
            .map(|(w, c)| (w.as_str(), *c))
            .collect();
        found.sort_unstable_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));
        found.truncate(limit);
        found
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assamese_dictionary_merges_only_internal_apostrophe_aliases() {
        let module = DictionaryModule::from_json_slice(include_bytes!(
            "../../modules/languages/as/dictionary.json"
        ))
        .unwrap();
        let mut module = module;
        module.dictionary.words = [
            ("নহ'লে".to_string(), 4),
            ("নহ’লে".to_string(), 11),
            ("নহʼলে".to_string(), 8),
            ("’নহলে".to_string(), 40),
            ("নহলেʼ".to_string(), 50),
            ("নহ’abc".to_string(), 60),
            ("নহ’১".to_string(), 70),
        ]
        .into();
        let dictionary = Dictionary::new(&module);
        assert_eq!(dictionary.completions("নহ'", 5), [("নহ'লে", 23)]);
        assert_eq!(dictionary.count("'নহলে"), None);
        assert_eq!(dictionary.count("নহলে'"), None);
        module.language.tag = "bn".to_string();
        assert_eq!(Dictionary::new(&module).count("নহ'লে"), Some(4));
    }

    #[test]
    fn looks_up_words_prefixes_and_completions() {
        let d = Dictionary::from_words([
            ("কথা".to_string(), 50),
            ("কথাটো".to_string(), 5),
            ("কথাবোৰ".to_string(), 9),
            ("কম".to_string(), 20),
        ]);
        assert_eq!(d.count("কথা"), Some(50));
        assert_eq!(d.count("কথ"), None);
        assert!(d.has_prefix("কথ"));
        assert!(!d.has_prefix("খ"));
        let c: Vec<&str> = d.completions("কথা", 5).into_iter().map(|(w, _)| w).collect();
        assert_eq!(c, ["কথাবোৰ", "কথাটো"]);
    }
}
