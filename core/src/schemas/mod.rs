//! Languages bundled with the engine for clients that don't load packs yet (web, extension, CLI,
//! Linux). Each one is just the pack JSON from `modules/languages/<tag>/` compiled in; new clients
//! should load packs with [`crate::PackStore`] instead.

use crate::types::TransliterationSchema;
use unsigned_resource_format::TransliterationModule;

const ASSAMESE: &str = include_str!("../../../modules/languages/as/transliteration.json");
const HINDI: &str = include_str!("../../../modules/languages/hi/transliteration.json");
const BANGLA: &str = include_str!("../../../modules/languages/bn/transliteration.json");

fn bundled(json: &str) -> TransliterationSchema {
    TransliterationModule::from_json_str(json)
        .expect("bundled transliteration pack must be valid")
        .schema
}

pub fn assamese_schema() -> TransliterationSchema {
    bundled(ASSAMESE)
}

pub fn hindi_schema() -> TransliterationSchema {
    bundled(HINDI)
}

pub fn bangla_schema() -> TransliterationSchema {
    bundled(BANGLA)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Transliterator;

    #[test]
    fn bundled_packs_are_valid() {
        for (json, tag) in [(ASSAMESE, "as"), (HINDI, "hi"), (BANGLA, "bn")] {
            assert_eq!(
                TransliterationModule::from_json_str(json)
                    .unwrap()
                    .language
                    .tag,
                tag
            );
        }
    }

    /// Outputs recorded from the hardcoded Rust schemas before they moved to JSON.
    #[test]
    fn same_output_as_the_old_built_in_schemas() {
        let hi = Transliterator::new(hindi_schema());
        let bn = Transliterator::new(bangla_schema());
        let as_ = Transliterator::new(assamese_schema());
        for (t, input, out) in [
            (&hi, "namaste", "नमस्ते"),
            (&hi, "bharat", "भरत"),
            (&hi, "kemon", "केमोन"),
            (&hi, "ksh", "क्ष"),
            (&bn, "namaste", "নামাস্তে"),
            (&bn, "ami", "আমি"),
            (&bn, "kemon", "কেমন"),
            (&bn, "gyan", "জ্ঞান"),
            (&as_, "nomoskar", "নমস্কাৰ"),
        ] {
            assert_eq!(t.transliterate(input), out, "{input}");
        }
    }
}
