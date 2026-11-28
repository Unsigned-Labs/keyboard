//! Loading language packs into the engine.

use std::collections::HashMap;

use crate::{Candidate, CandidateModel, Dictionary, Transliterator};

pub use unsigned_resource_format::{
    compare_versions, EngineCompatibility, InputMethodModule, KeyboardLayoutModule,
    LanguageIdentity, Pack, PackInfo, ResourceError, ResourceKind, ResourceMetadata,
    TransliterationModule, RESOURCE_FORMAT_VERSION, TRANSLITERATION_ENGINE_ABI,
};

/// Load one transliteration pack into a ready-to-use transliterator.
pub fn load_transliteration_module(bytes: &[u8]) -> Result<Transliterator, ResourceError> {
    let module = TransliterationModule::from_json_slice(bytes)?;
    Ok(Transliterator::new(module.schema))
}

/// The packs an app has loaded, by resource id. Loading a pack whose id is already present replaces
/// it only if the new version is the same or newer, so an older imported copy can't shadow a newer
/// bundled one by accident.
#[derive(Default)]
pub struct PackStore {
    packs: HashMap<String, Pack>,
    transliterators: HashMap<String, (Transliterator, CandidateModel)>,
    dictionaries: HashMap<String, Dictionary>,
}

impl PackStore {
    pub fn new() -> Self {
        Self::default()
    }

    /// Validate and add a pack. Returns its info, or why it was rejected.
    pub fn load(&mut self, bytes: &[u8]) -> Result<PackInfo, ResourceError> {
        let pack = Pack::from_json_slice(bytes)?;
        let info = pack.info();
        if let Some(existing) = self.packs.get(&info.id) {
            if compare_versions(&existing.resource().version, &info.version).is_gt() {
                return Ok(existing.info());
            }
        }
        let pack = match pack {
            Pack::Transliteration(module) => {
                let model = CandidateModel::new(&module.schema);
                let transliterator = Transliterator::new(module.schema.clone());
                self.transliterators
                    .insert(info.id.clone(), (transliterator, model));
                Pack::Transliteration(module)
            }
            // The words live in the sorted lookup table only; the kept pack is just its header.
            Pack::Dictionary(mut module) => {
                self.dictionaries
                    .insert(info.id.clone(), Dictionary::new(&module));
                module.dictionary.words = HashMap::new();
                Pack::Dictionary(module)
            }
            other => other,
        };
        self.packs.insert(info.id.clone(), pack);
        Ok(info)
    }

    pub fn remove(&mut self, id: &str) {
        self.packs.remove(id);
        self.transliterators.remove(id);
        self.dictionaries.remove(id);
    }

    pub fn get(&self, id: &str) -> Option<&Pack> {
        self.packs.get(id)
    }

    pub fn list(&self) -> Vec<PackInfo> {
        let mut all: Vec<PackInfo> = self.packs.values().map(Pack::info).collect();
        all.sort_by(|a, b| a.id.cmp(&b.id));
        all
    }

    /// Ids an input method needs that aren't loaded.
    pub fn missing_dependencies(&self, input_method_id: &str) -> Vec<String> {
        match self.packs.get(input_method_id) {
            Some(Pack::InputMethod(m)) => m
                .dependencies()
                .into_iter()
                .filter(|d| !self.packs.contains_key(*d))
                .map(String::from)
                .collect(),
            _ => vec![input_method_id.to_string()],
        }
    }

    /// Every character used in the inputs of a transliteration pack. Apps send these keys to the
    /// transliterator and type anything else directly.
    pub fn input_alphabet(&self, transliteration_id: &str) -> String {
        let Some(Pack::Transliteration(m)) = self.packs.get(transliteration_id) else {
            return String::new();
        };
        let s = &m.schema;
        let mut chars: Vec<char> = [
            &s.consonants,
            &s.vowels,
            &s.vowel_marks,
            &s.special_char,
            &s.digits,
        ]
        .into_iter()
        .flat_map(|map| map.values().flatten())
        .chain(s.exceptions.special_combinations.keys())
        .flat_map(|input| input.chars())
        .collect();
        chars.sort_unstable();
        chars.dedup();
        chars.into_iter().collect()
    }

    pub fn clear(&mut self) {
        self.packs.clear();
        self.transliterators.clear();
        self.dictionaries.clear();
    }

    /// Transliterate with a loaded transliteration pack. Unknown ids return the input unchanged.
    pub fn transliterate(&self, transliteration_id: &str, input: &str) -> String {
        match self.transliterators.get(transliteration_id) {
            Some((t, _)) => t.transliterate(input),
            None => input.to_string(),
        }
    }

    /// Converts a whole text typed with an input method, word by word, taking each word's best
    /// candidate. Punctuation the scheme doesn't use is kept around a word (`kotha,` → `কথা,`, and a
    /// final full stop stays a full stop); a word with such characters inside it, like `mo.i` or a
    /// backtick escape, goes through the plain transliterator so its controls still work.
    pub fn convert(&self, input_method_id: &str, text: &str) -> String {
        let Some(Pack::InputMethod(im)) = self.packs.get(input_method_id) else {
            return text.to_string();
        };
        let Some(transliteration) = im.input_method.transliteration.as_deref() else {
            return text.to_string();
        };
        if text.contains('`') {
            // Text between backticks stays as typed; the rest is converted.
            return text
                .split('`')
                .enumerate()
                .map(|(i, part)| {
                    if i % 2 == 1 {
                        part.to_string()
                    } else {
                        self.convert(input_method_id, part)
                    }
                })
                .collect();
        }
        let alphabet = self.input_alphabet(transliteration);
        let in_alphabet = |c: char| alphabet.contains(c);

        let mut out = String::with_capacity(text.len() * 3);
        let mut rest = text;
        while !rest.is_empty() {
            let space_len = rest.len() - rest.trim_start().len();
            out.push_str(&rest[..space_len]);
            rest = &rest[space_len..];
            let word_len = rest.find(char::is_whitespace).unwrap_or(rest.len());
            let word = &rest[..word_len];
            rest = &rest[word_len..];
            if word.is_empty() {
                continue;
            }

            let core_start = word.find(in_alphabet).unwrap_or(word.len());
            let core_end = word.rfind(in_alphabet).map_or(core_start, |i| {
                i + word[i..].chars().next().map_or(0, char::len_utf8)
            });
            let (lead, core, trail) = (
                &word[..core_start],
                &word[core_start..core_end],
                &word[core_end..],
            );
            if core.is_empty() {
                out.push_str(word);
            } else if core.chars().all(in_alphabet) {
                out.push_str(lead);
                match self.candidates(input_method_id, core, 2).first() {
                    Some(best) => out.push_str(&best.text),
                    None => out.push_str(&self.transliterate(transliteration, core)),
                }
                out.push_str(trail);
            } else {
                out.push_str(&self.transliterate(transliteration, word));
            }
        }
        out
    }

    /// Ranked candidates for what was typed with an input method: dictionary words, the exact
    /// transliteration, completions and the input itself. See [`CandidateModel::candidates`].
    pub fn candidates(&self, input_method_id: &str, input: &str, limit: usize) -> Vec<Candidate> {
        let Some(Pack::InputMethod(im)) = self.packs.get(input_method_id) else {
            return vec![];
        };
        let Some((transliterator, model)) = im
            .input_method
            .transliteration
            .as_deref()
            .and_then(|id| self.transliterators.get(id))
        else {
            return vec![];
        };
        let dictionary = im
            .input_method
            .dictionary
            .as_deref()
            .and_then(|id| self.dictionaries.get(id));
        let exact = transliterator.transliterate(input);
        model.candidates(input, &exact, dictionary, limit)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const ASSAMESE: &[u8] = include_bytes!("../../modules/languages/as/transliteration.json");

    #[test]
    fn loads_assamese_without_a_language_specific_core_api() {
        let transliterator = load_transliteration_module(ASSAMESE).unwrap();
        assert_eq!(transliterator.transliterate("nomoskar"), "নমস্কাৰ");
    }

    #[test]
    fn store_transliterates_by_pack_id_and_keeps_newest_version() {
        let mut store = PackStore::new();
        let info = store.load(ASSAMESE).unwrap();
        assert_eq!(info.id, "org.unsigned.transliteration.as");
        assert_eq!(store.transliterate(&info.id, "nomoskar"), "নমস্কাৰ");

        let older = String::from_utf8(ASSAMESE.to_vec()).unwrap().replacen(
            "\"version\": \"1.0.0\"",
            "\"version\": \"0.9.0\"",
            1,
        );
        assert_eq!(store.load(older.as_bytes()).unwrap().version, "1.0.0");

        assert_eq!(store.transliterate("missing", "abc"), "abc");
        let alphabet = store.input_alphabet(&info.id);
        assert!(alphabet.contains('k') && alphabet.contains('|') && !alphabet.contains(','));
    }

    fn json_files(dir: &std::path::Path, out: &mut Vec<std::path::PathBuf>) {
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                json_files(&path, out);
            } else if path.extension().is_some_and(|e| e == "json") {
                out.push(path);
            }
        }
    }

    #[test]
    fn every_bundled_pack_loads_and_every_input_method_is_complete() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../modules");
        let mut files = Vec::new();
        json_files(&root, &mut files);
        let mut store = PackStore::new();
        for file in &files {
            store
                .load(&std::fs::read(file).unwrap())
                .unwrap_or_else(|e| panic!("{}: {e}", file.display()));
        }
        let input_methods: Vec<_> = store
            .list()
            .into_iter()
            .filter(|p| p.kind == ResourceKind::InputMethod)
            .collect();
        assert!(input_methods.len() >= 5);
        for im in input_methods {
            assert!(store.missing_dependencies(&im.id).is_empty(), "{}", im.id);
        }
        assert_eq!(
            store.convert(
                "org.unsigned.input.as.phonetic",
                "moi nodi, korisil.  mo.i (kotha)"
            ),
            "মই নদী, কৰিছিল.  মই (কথা)"
        );
        assert_eq!(
            store.convert("org.unsigned.input.hi.phonetic", "aap kaise hain?"),
            "आप कैसे हैं?"
        );
        assert!(store
            .get("org.unsigned.layout.as.native")
            .unwrap()
            .to_json()
            .contains("after_consonant"));
    }
}
