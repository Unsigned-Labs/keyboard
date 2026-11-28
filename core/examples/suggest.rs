//! cargo run --example suggest -- <input method id> <word>...
//! Prints the candidates for each word using the packs in modules/.

fn main() {
    let mut args = std::env::args().skip(1);
    let im = args.next().expect("input method id");
    let mut store = transliterator::PackStore::new();
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../modules");
    let mut stack = vec![root];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(dir).unwrap().flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if path.extension().is_some_and(|e| e == "json") {
                store.load(&std::fs::read(&path).unwrap()).unwrap();
            }
        }
    }
    for word in args {
        let start = std::time::Instant::now();
        let c = store.candidates(&im, &word, 8);
        let took = start.elapsed();
        let list: Vec<String> = c.iter().map(|c| format!("{} ({:?})", c.text, c.kind)).collect();
        println!("{word:>12} [{took:.1?}] {}", list.join(", "));
    }
}
