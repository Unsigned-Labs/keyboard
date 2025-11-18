use crate::types::{TransliterationSchema, Exceptions};
use std::collections::HashMap;

pub fn bangla_schema() -> TransliterationSchema {
    let mut consonants = HashMap::new();
    consonants.insert("ক".to_string(), vec!["k".to_string(), "K".to_string()]);
    consonants.insert("খ".to_string(), vec!["kh".to_string(), "kH".to_string(), "Kh".to_string(), "KH".to_string()]);
    consonants.insert("গ".to_string(), vec!["g".to_string(), "G".to_string()]);
    consonants.insert("ঘ".to_string(), vec!["gh".to_string(), "gH".to_string(), "Gh".to_string(), "GH".to_string()]);
    consonants.insert("ঙ".to_string(), vec!["ng".to_string(), "Ng".to_string(), "NG".to_string(), "nG".to_string()]);
    consonants.insert("চ".to_string(), vec!["c".to_string(), "ch".to_string()]);
    consonants.insert("ছ".to_string(), vec!["C".to_string(), "Ch".to_string(), "chh".to_string(), "Chh".to_string(), "CHh".to_string(), "CHH".to_string()]);
    consonants.insert("জ".to_string(), vec!["j".to_string(), "J".to_string()]);
    consonants.insert("ঝ".to_string(), vec!["jh".to_string(), "jH".to_string(), "Jh".to_string(), "JH".to_string()]);
    consonants.insert("ঞ".to_string(), vec!["ny".to_string()]);
    consonants.insert("ট".to_string(), vec!["T".to_string()]);
    consonants.insert("ঠ".to_string(), vec!["Th".to_string()]);
    consonants.insert("ড".to_string(), vec!["D".to_string()]);
    consonants.insert("ঢ".to_string(), vec!["Dh".to_string()]);
    consonants.insert("ণ".to_string(), vec!["N".to_string()]);
    consonants.insert("ত".to_string(), vec!["t".to_string()]);
    consonants.insert("থ".to_string(), vec!["th".to_string()]);
    consonants.insert("দ".to_string(), vec!["d".to_string()]);
    consonants.insert("ধ".to_string(), vec!["dh".to_string()]);
    consonants.insert("ন".to_string(), vec!["n".to_string()]);
    consonants.insert("প".to_string(), vec!["p".to_string(), "P".to_string()]);
    consonants.insert("ফ".to_string(), vec!["f".to_string(), "F".to_string(), "ph".to_string(), "pH".to_string(), "Ph".to_string(), "PH".to_string()]);
    consonants.insert("ব".to_string(), vec!["b".to_string(), "B".to_string()]);
    consonants.insert("ভ".to_string(), vec!["v".to_string(), "V".to_string(), "bh".to_string(), "bH".to_string(), "Bh".to_string(), "BH".to_string()]);
    consonants.insert("ম".to_string(), vec!["m".to_string(), "M".to_string()]);
    consonants.insert("য".to_string(), vec!["z".to_string()]);
    consonants.insert("র".to_string(), vec!["r".to_string()]);
    consonants.insert("ল".to_string(), vec!["l".to_string(), "L".to_string()]);
    consonants.insert("শ".to_string(), vec!["sh".to_string(), "Sh".to_string(), "SH".to_string(), "sH".to_string()]);
    consonants.insert("ষ".to_string(), vec!["Sh".to_string(), "shh".to_string(), "Shh".to_string(), "SHh".to_string(), "SHH".to_string()]);
    consonants.insert("স".to_string(), vec!["s".to_string(), "S".to_string()]);
    consonants.insert("হ".to_string(), vec!["h".to_string(), "H".to_string()]);
    consonants.insert("ড়".to_string(), vec!["rr".to_string(), "R".to_string(), "RR".to_string(), "rR".to_string(), "Rr".to_string()]);
    consonants.insert("ঢ়".to_string(), vec!["rh".to_string(), "Rh".to_string(), "rH".to_string(), "RH".to_string()]);
    consonants.insert("য়".to_string(), vec!["y".to_string(), "Y".to_string()]);
    consonants.insert("ক্ষ".to_string(), vec!["x".to_string(), "X".to_string()]);

    let mut vowels = HashMap::new();
    vowels.insert("অ".to_string(), vec!["o".to_string()]);
    vowels.insert("আ".to_string(), vec!["a".to_string()]);
    vowels.insert("ই".to_string(), vec!["i".to_string()]);
    vowels.insert("ঈ".to_string(), vec!["ii".to_string(), "I".to_string()]);
    vowels.insert("উ".to_string(), vec!["u".to_string()]);
    vowels.insert("ঊ".to_string(), vec!["uu".to_string(), "U".to_string()]);
    vowels.insert("ঋ".to_string(), vec!["ri".to_string()]);
    vowels.insert("এ".to_string(), vec!["e".to_string()]);
    vowels.insert("ঐ".to_string(), vec!["oi".to_string()]);
    vowels.insert("ও".to_string(), vec!["O".to_string()]);
    vowels.insert("ঔ".to_string(), vec!["ou".to_string()]);

    let mut vowel_marks = HashMap::new();
    vowel_marks.insert("".to_string(), vec!["o".to_string()]);
    vowel_marks.insert("া".to_string(), vec!["a".to_string()]);
    vowel_marks.insert("ি".to_string(), vec!["i".to_string()]);
    vowel_marks.insert("ী".to_string(), vec!["ii".to_string(), "I".to_string()]);
    vowel_marks.insert("ু".to_string(), vec!["u".to_string()]);
    vowel_marks.insert("ূ".to_string(), vec!["uu".to_string(), "U".to_string()]);
    vowel_marks.insert("ৃ".to_string(), vec!["ri".to_string()]);
    vowel_marks.insert("ে".to_string(), vec!["e".to_string()]);
    vowel_marks.insert("ৈ".to_string(), vec!["oi".to_string()]);
    vowel_marks.insert("ো".to_string(), vec!["O".to_string()]);
    vowel_marks.insert("ৌ".to_string(), vec!["ou".to_string()]);

    let mut special_char = HashMap::new();
    special_char.insert("ং".to_string(), vec!["ng".to_string(), "Ng".to_string(), "NG".to_string(), "nG".to_string()]);
    special_char.insert("ঃ".to_string(), vec!["h".to_string()]);
    special_char.insert("ঁ".to_string(), vec!["*".to_string()]);
    special_char.insert("্".to_string(), vec!["".to_string()]);
    special_char.insert("।".to_string(), vec!["|".to_string()]);

    let mut digits = HashMap::new();
    digits.insert("০".to_string(), vec!["0".to_string()]);
    digits.insert("১".to_string(), vec!["1".to_string()]);
    digits.insert("২".to_string(), vec!["2".to_string()]);
    digits.insert("৩".to_string(), vec!["3".to_string()]);
    digits.insert("৪".to_string(), vec!["4".to_string()]);
    digits.insert("৫".to_string(), vec!["5".to_string()]);
    digits.insert("৬".to_string(), vec!["6".to_string()]);
    digits.insert("৭".to_string(), vec!["7".to_string()]);
    digits.insert("৮".to_string(), vec!["8".to_string()]);
    digits.insert("৯".to_string(), vec!["9".to_string()]);

    let mut special_combinations = HashMap::new();
    special_combinations.insert("gy".to_string(), "জ্ঞ".to_string());
    special_combinations.insert("dnyo".to_string(), "জ্ঞ".to_string());
    special_combinations.insert("kkhyo".to_string(), "ক্ষ্য".to_string());

    let mut joined_consonants_after = HashMap::new();
    joined_consonants_after.insert("w".to_string(), "ব".to_string());

    let exceptions = Exceptions {
        special_combinations,
        joined_consonants_before: HashMap::new(),
        joined_consonants_after,
        explicit_holonto: "্".to_string(),
    };

    TransliterationSchema {
        consonants,
        vowels,
        vowel_marks,
        special_char,
        digits,
        exceptions,
    }
}
