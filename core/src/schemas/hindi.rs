use crate::types::{TransliterationSchema, Exceptions};
use std::collections::HashMap;

pub fn hindi_schema() -> TransliterationSchema {
    let mut consonants = HashMap::new();
    consonants.insert("क".to_string(), vec!["k".to_string(), "K".to_string()]);
    consonants.insert("ख".to_string(), vec!["kh".to_string(), "kH".to_string(), "Kh".to_string(), "KH".to_string()]);
    consonants.insert("ग".to_string(), vec!["g".to_string(), "G".to_string()]);
    consonants.insert("घ".to_string(), vec!["gh".to_string(), "gH".to_string(), "Gh".to_string(), "GH".to_string()]);
    consonants.insert("ङ".to_string(), vec!["ng".to_string(), "Ng".to_string(), "NG".to_string(), "nG".to_string()]);
    consonants.insert("च".to_string(), vec!["c".to_string(), "ch".to_string()]);
    consonants.insert("छ".to_string(), vec!["C".to_string(), "Ch".to_string(), "chh".to_string(), "Chh".to_string(), "CHh".to_string(), "CHH".to_string()]);
    consonants.insert("ज".to_string(), vec!["j".to_string(), "J".to_string()]);
    consonants.insert("झ".to_string(), vec!["jh".to_string(), "jH".to_string(), "Jh".to_string(), "JH".to_string()]);
    consonants.insert("ञ".to_string(), vec!["ny".to_string()]);
    consonants.insert("ट".to_string(), vec!["T".to_string()]);
    consonants.insert("ठ".to_string(), vec!["Th".to_string()]);
    consonants.insert("ड".to_string(), vec!["D".to_string()]);
    consonants.insert("ढ".to_string(), vec!["Dh".to_string()]);
    consonants.insert("ण".to_string(), vec!["N".to_string()]);
    consonants.insert("त".to_string(), vec!["t".to_string()]);
    consonants.insert("थ".to_string(), vec!["th".to_string()]);
    consonants.insert("द".to_string(), vec!["d".to_string()]);
    consonants.insert("ध".to_string(), vec!["dh".to_string()]);
    consonants.insert("न".to_string(), vec!["n".to_string()]);
    consonants.insert("प".to_string(), vec!["p".to_string(), "P".to_string()]);
    consonants.insert("फ".to_string(), vec!["f".to_string(), "F".to_string(), "ph".to_string(), "pH".to_string(), "Ph".to_string(), "PH".to_string()]);
    consonants.insert("ब".to_string(), vec!["b".to_string(), "B".to_string()]);
    consonants.insert("भ".to_string(), vec!["v".to_string(), "V".to_string(), "bh".to_string(), "bH".to_string(), "Bh".to_string(), "BH".to_string()]);
    consonants.insert("म".to_string(), vec!["m".to_string(), "M".to_string()]);
    consonants.insert("य".to_string(), vec!["y".to_string(), "Y".to_string()]);
    consonants.insert("र".to_string(), vec!["r".to_string()]);
    consonants.insert("ल".to_string(), vec!["l".to_string(), "L".to_string()]);
    consonants.insert("व".to_string(), vec!["w".to_string(), "W".to_string()]);
    consonants.insert("श".to_string(), vec!["sh".to_string(), "Sh".to_string(), "SH".to_string(), "sH".to_string()]);
    consonants.insert("ष".to_string(), vec!["Sh".to_string(), "shh".to_string(), "Shh".to_string(), "SHh".to_string(), "SHH".to_string()]);
    consonants.insert("स".to_string(), vec!["s".to_string(), "S".to_string()]);
    consonants.insert("ह".to_string(), vec!["h".to_string(), "H".to_string()]);
    consonants.insert("क्ष".to_string(), vec!["x".to_string(), "X".to_string(), "ksh".to_string(), "Ksh".to_string(), "KSh".to_string(), "KSH".to_string()]);
    consonants.insert("त्र".to_string(), vec!["tr".to_string()]);
    consonants.insert("ज्ञ".to_string(), vec!["gy".to_string(), "dnyo".to_string()]);
    consonants.insert("ड़".to_string(), vec!["rr".to_string(), "R".to_string(), "RR".to_string(), "rR".to_string(), "Rr".to_string()]);
    consonants.insert("ढ़".to_string(), vec!["rh".to_string(), "Rh".to_string(), "rH".to_string(), "RH".to_string()]);

    let mut vowels = HashMap::new();
    vowels.insert("अ".to_string(), vec!["a".to_string()]);
    vowels.insert("आ".to_string(), vec!["aa".to_string(), "A".to_string()]);
    vowels.insert("इ".to_string(), vec!["i".to_string()]);
    vowels.insert("ई".to_string(), vec!["ii".to_string(), "I".to_string()]);
    vowels.insert("उ".to_string(), vec!["u".to_string()]);
    vowels.insert("ऊ".to_string(), vec!["uu".to_string(), "U".to_string()]);
    vowels.insert("ऋ".to_string(), vec!["ri".to_string()]);
    vowels.insert("ए".to_string(), vec!["e".to_string()]);
    vowels.insert("ऐ".to_string(), vec!["ai".to_string()]);
    vowels.insert("ओ".to_string(), vec!["o".to_string()]);
    vowels.insert("औ".to_string(), vec!["au".to_string()]);

    let mut vowel_marks = HashMap::new();
    vowel_marks.insert("".to_string(), vec!["a".to_string()]);
    vowel_marks.insert("ा".to_string(), vec!["aa".to_string(), "A".to_string()]);
    vowel_marks.insert("ि".to_string(), vec!["i".to_string()]);
    vowel_marks.insert("ी".to_string(), vec!["ii".to_string(), "I".to_string()]);
    vowel_marks.insert("ु".to_string(), vec!["u".to_string()]);
    vowel_marks.insert("ू".to_string(), vec!["uu".to_string(), "U".to_string()]);
    vowel_marks.insert("ृ".to_string(), vec!["ri".to_string()]);
    vowel_marks.insert("े".to_string(), vec!["e".to_string()]);
    vowel_marks.insert("ै".to_string(), vec!["ai".to_string()]);
    vowel_marks.insert("ो".to_string(), vec!["o".to_string()]);
    vowel_marks.insert("ौ".to_string(), vec!["au".to_string()]);

    let mut special_char = HashMap::new();
    special_char.insert("ं".to_string(), vec!["ng".to_string(), "Ng".to_string(), "NG".to_string(), "nG".to_string()]);
    special_char.insert("ः".to_string(), vec!["h".to_string()]);
    special_char.insert("ँ".to_string(), vec!["*".to_string()]);
    special_char.insert("्".to_string(), vec!["".to_string()]);
    special_char.insert("।".to_string(), vec!["|".to_string()]);
    special_char.insert("॥".to_string(), vec!["||".to_string()]);

    let mut digits = HashMap::new();
    digits.insert("०".to_string(), vec!["0".to_string()]);
    digits.insert("१".to_string(), vec!["1".to_string()]);
    digits.insert("२".to_string(), vec!["2".to_string()]);
    digits.insert("३".to_string(), vec!["3".to_string()]);
    digits.insert("४".to_string(), vec!["4".to_string()]);
    digits.insert("५".to_string(), vec!["5".to_string()]);
    digits.insert("६".to_string(), vec!["6".to_string()]);
    digits.insert("७".to_string(), vec!["7".to_string()]);
    digits.insert("८".to_string(), vec!["8".to_string()]);
    digits.insert("९".to_string(), vec!["9".to_string()]);

    let mut special_combinations = HashMap::new();
    special_combinations.insert("gy".to_string(), "ज्ञ".to_string());
    special_combinations.insert("dnyo".to_string(), "ज्ञ".to_string());
    special_combinations.insert("ksh".to_string(), "क्ष".to_string());
    special_combinations.insert("tr".to_string(), "त्र".to_string());

    let exceptions = Exceptions {
        special_combinations,
        joined_consonants_before: HashMap::new(),
        joined_consonants_after: HashMap::new(),
        explicit_holonto: "्".to_string(),
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
