import { TransliterationScheme } from "@/types/transliteration";

export const assameseScheme: TransliterationScheme = {
  consonants: {
    ক: ["k", "K"],
    খ: ["kh", "kH", "Kh", "KH"],
    গ: ["g", "G"],
    ঘ: ["gh", "gH", "Gh", "GH"],
    ঙ: ["ng", "Ng", "NG", "nG"],
    চ: ["s", "c"],
    ছ: ["S", "ss", "Ss", "SS", "cc", "Cc", "CC"],
    জ: ["j", "z"],
    ঝ: ["jh", "jH", "Jh", "JH"],
    ঞ: ["yy", "Y"],
    ট: ["T"],
    ঠ: ["Th"],
    ড: ["D"],
    ঢ: ["Dh"],
    ণ: ["N"],
    ত: ["t"],
    থ: ["th"],
    দ: ["d"],
    ধ: ["dh"],
    ন: ["n"],
    প: ["p", "P"],
    ফ: ["f", "F", "ph", "pH", "Ph", "PH"],
    ব: ["b", "B"],
    ভ: ["v", "V", "bh", "bH", "Bh", "BH"],
    ম: ["m", "M"],
    য: ["J", "jj", "JJ", "Jj", "Z", "zz", "ZZ", "Zz"],
    ৰ: ["r"],
    ল: ["l", "L"],
    ৱ: ["w", "W"],
    স: ["x", "X"],
    শ: ["xx", "Xx", "xX", "XX"],
    ষ: ["xxx", "XxX", "xXX", "XXX", "xxX", "xXx", "Xxx"],
    হ: ["h", "H"],
    ড়: ["rr", "R", "RR", "rR", "Rr"],
    ঢ়: ["rh", "Rh", "rH", "RH"],
    য়: ["y"],
    ক্ষ: ["khyy"],
  },
  vowels: {
    অ: ["o"],
    আ: ["a"],
    ই: ["i"],
    ঈ: ["ii"],
    উ: ["u"],
    ঊ: ["uu", "U"],
    ঋ: ["riii"],
    এ: ["e"],
    ঐ: ["oi"],
    ও: ["uuu", "oo", "O"],
    ঔ: ["ou"],
  },
  vowelMarks: {
    "": ["o"],
    "া": ["a"],
    "ি": ["i"],
    "ী": ["ii"],
    "ু": ["u"],
    "ূ": ["uu", "U"],
    "ৃ": ["riii"],
    "ে": ["e"],
    "ৈ": ["oi"],
    "ো": ["uuu", "oo", "O"],
    "ৌ": ["ou"],
  },
  specialChar: {
    "ং": ["ngg", "Ngg", "nGg", "NGg", "ngG", "NgG", "nGG", "NGG"],
    "ঃ": ["hh", "HH", "hH", "Hh"],
    "ঁ": ["*"],
    "ৎ": ["t", "T"],
    "।": ["|"],
  },
  digits: {
    "০": ["0"],
    "১": ["1"],
    "২": ["2"],
    "৩": ["3"],
    "৪": ["4"],
    "৫": ["5"],
    "৬": ["6"],
    "৭": ["7"],
    "৮": ["8"],
    "৯": ["9"],
  },
  exceptions: {
    specialCombinations: {
      "gyy": "জ্ঞ",
      "jyy": "হ্য",
      "khm": "ক্ষ্ম",
    },
    joinedConsonantsBefore: {
      "চ": "স",
    },
    joinedConsonantsAfter: {
      "w": "ব",
      "y": "য",
    },
    explicitHolonto: "্",
  },
};
