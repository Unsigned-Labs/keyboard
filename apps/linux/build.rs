//! Embeds the repo's language packs (modules/**/*.json) into the engine binary.

use std::fs;
use std::path::{Path, PathBuf};

fn json_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            json_files(&path, out);
        } else if path.extension().is_some_and(|e| e == "json") {
            out.push(path);
        }
    }
}

fn main() {
    let modules = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../modules");
    println!("cargo:rerun-if-changed={}", modules.display());
    let mut files = Vec::new();
    json_files(&modules, &mut files);
    files.sort();

    let mut code = String::from("pub const BUNDLED_PACKS: &[&[u8]] = &[\n");
    for file in &files {
        println!("cargo:rerun-if-changed={}", file.display());
        let path = fs::canonicalize(file).unwrap();
        code.push_str(&format!("    include_bytes!({:?}),\n", path.display().to_string()));
    }
    code.push_str("];\n");
    let out = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("bundled_packs.rs");
    fs::write(out, code).unwrap();
}
