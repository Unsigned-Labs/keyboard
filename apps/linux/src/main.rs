use std::io::{self, BufRead, Write};
use transliterator::{Transliterator, assamese_schema, bangla_schema, hindi_schema};

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    // Default to Assamese as requested
    let mut current_schema = String::from("assamese");
    let mut buffer = String::new();

    // Send ready signal
    writeln!(stdout, "READY").unwrap();
    stdout.flush().unwrap();

    for line in stdin.lock().lines() {
        let line = line.unwrap();
        let parts: Vec<&str> = line.trim().split_whitespace().collect();

        if parts.is_empty() {
            continue;
        }

        match parts[0] {
            "SET_SCHEMA" => {
                if parts.len() > 1 {
                    current_schema = parts[1].to_string();
                    writeln!(stdout, "OK").unwrap();
                } else {
                    writeln!(stdout, "ERROR missing schema").unwrap();
                }
            }
            "TRANSLITERATE" => {
                if parts.len() > 1 {
                    let input = parts[1..].join(" ");
                    let transliterator = match current_schema.as_str() {
                        "hindi" => Transliterator::new(hindi_schema()),
                        "bangla" => Transliterator::new(bangla_schema()),
                        _ => Transliterator::new(assamese_schema()),
                    };
                    let result = transliterator.transliterate(&input);
                    writeln!(stdout, "RESULT {}", result).unwrap();
                } else {
                    writeln!(stdout, "ERROR missing input").unwrap();
                }
            }
            "BUFFER_ADD" => {
                if parts.len() > 1 {
                    buffer.push_str(parts[1]);
                    let transliterator = match current_schema.as_str() {
                        "hindi" => Transliterator::new(hindi_schema()),
                        "bangla" => Transliterator::new(bangla_schema()),
                        _ => Transliterator::new(assamese_schema()),
                    };
                    let result = transliterator.transliterate(&buffer);
                    writeln!(stdout, "UPDATE {}", result).unwrap();
                } else {
                    writeln!(stdout, "ERROR missing character").unwrap();
                }
            }
            "BUFFER_CLEAR" => {
                buffer.clear();
                writeln!(stdout, "OK").unwrap();
            }
            "BUFFER_COMMIT" => {
                let transliterator = match current_schema.as_str() {
                    "hindi" => Transliterator::new(hindi_schema()),
                    "bangla" => Transliterator::new(bangla_schema()),
                    _ => Transliterator::new(assamese_schema()),
                };
                let result = transliterator.transliterate(&buffer);
                writeln!(stdout, "COMMIT {}", result).unwrap();
                buffer.clear();
            }
            "QUIT" => break,
            _ => {
                writeln!(stdout, "ERROR unknown command").unwrap();
            }
        }
        stdout.flush().unwrap();
    }
}
