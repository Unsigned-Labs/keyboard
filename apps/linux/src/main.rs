//! Line-based engine for the IBus wrapper (ibus-engine-unsigned.py).
//!
//! Commands, one per line; every command gets one reply line:
//!   LIST                     → INPUT_METHODS <json array of {id, name, short_label}>
//!   SET_INPUT_METHOD <id>    → OK | ERROR <reason>
//!   SET_SCHEMA <language>    → OK (assamese, bangla or hindi; older wrappers)
//!   CANDIDATES <text>        → CANDIDATES <json array of {text, kind}>, best first
//!   TRANSLITERATE <text>     → RESULT <text>
//!   RELOAD                   → OK <number of packs>
//!   QUIT
//!
//! Packs: the ones built into the binary, plus `*.json` in $UNSIGNED_KEYBOARD_PACKS (colon
//! separated) and ~/.local/share/unsigned-keyboard/packs. Invalid files are reported on stderr and
//! skipped.

use std::io::{self, BufRead, Write};
use std::path::PathBuf;

use transliterator::{Pack, PackStore};

include!(concat!(env!("OUT_DIR"), "/bundled_packs.rs"));

const DEFAULT_INPUT_METHOD: &str = "org.unsigned.input.as.phonetic";
const CANDIDATE_LIMIT: usize = 9;

fn pack_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = std::env::var("UNSIGNED_KEYBOARD_PACKS")
        .map(|v| v.split(':').filter(|s| !s.is_empty()).map(PathBuf::from).collect())
        .unwrap_or_default();
    if let Some(home) = std::env::var_os("HOME") {
        dirs.push(PathBuf::from(home).join(".local/share/unsigned-keyboard/packs"));
    }
    dirs
}

fn load_all() -> PackStore {
    let mut store = PackStore::new();
    for bytes in BUNDLED_PACKS {
        if let Err(e) = store.load(bytes) {
            eprintln!("bundled pack rejected: {e}");
        }
    }
    for dir in pack_dirs() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        let mut files: Vec<PathBuf> = entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.extension().is_some_and(|e| e == "json"))
            .collect();
        files.sort();
        for file in files {
            match std::fs::read(&file).map(|b| store.load(&b)) {
                Ok(Ok(_)) => {}
                Ok(Err(e)) => eprintln!("{}: {e}", file.display()),
                Err(e) => eprintln!("{}: {e}", file.display()),
            }
        }
    }
    store
}

fn input_methods(store: &PackStore) -> String {
    let list: Vec<serde_json::Value> = store
        .list()
        .into_iter()
        .filter(|p| store.missing_dependencies(&p.id).is_empty())
        .filter_map(|p| match store.get(&p.id) {
            Some(Pack::InputMethod(m)) if m.input_method.transliteration.is_some() => {
                Some(serde_json::json!({
                    "id": p.id,
                    "name": m.input_method.name,
                    "short_label": m.input_method.short_label,
                }))
            }
            _ => None,
        })
        .collect();
    serde_json::to_string(&list).unwrap()
}

fn legacy_input_method(language: &str) -> &'static str {
    match language {
        "hindi" => "org.unsigned.input.hi.phonetic",
        "bangla" | "bengali" => "org.unsigned.input.bn.phonetic",
        _ => DEFAULT_INPUT_METHOD,
    }
}

fn transliteration_of(store: &PackStore, input_method: &str) -> Option<String> {
    match store.get(input_method) {
        Some(Pack::InputMethod(m)) => m.input_method.transliteration.clone(),
        _ => None,
    }
}

fn main() {
    let mut store = load_all();
    let mut input_method = DEFAULT_INPUT_METHOD.to_string();
    let stdout = io::stdout();
    let mut out = stdout.lock();
    writeln!(out, "READY").unwrap();
    out.flush().unwrap();

    for line in io::stdin().lock().lines() {
        let Ok(line) = line else { break };
        let line = line.trim_end_matches(['\r', '\n']);
        let (command, arg) = line.split_once(' ').unwrap_or((line, ""));
        let reply = match command {
            "LIST" => format!("INPUT_METHODS {}", input_methods(&store)),
            "SET_INPUT_METHOD" => match store.get(arg) {
                Some(Pack::InputMethod(_)) if store.missing_dependencies(arg).is_empty() => {
                    input_method = arg.to_string();
                    "OK".to_string()
                }
                _ => format!("ERROR unknown or incomplete input method {arg}"),
            },
            "SET_SCHEMA" => {
                input_method = legacy_input_method(arg.trim()).to_string();
                "OK".to_string()
            }
            "CANDIDATES" => {
                let candidates = store.candidates(&input_method, arg, CANDIDATE_LIMIT);
                format!("CANDIDATES {}", serde_json::to_string(&candidates).unwrap())
            }
            "TRANSLITERATE" => match transliteration_of(&store, &input_method) {
                Some(id) => format!("RESULT {}", store.transliterate(&id, arg)),
                None => format!("RESULT {arg}"),
            },
            "RELOAD" => {
                store = load_all();
                format!("OK {}", store.list().len())
            }
            "QUIT" => break,
            "" => continue,
            _ => "ERROR unknown command".to_string(),
        };
        writeln!(out, "{reply}").unwrap();
        out.flush().unwrap();
    }
}
