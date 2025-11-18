"use client";

import { useState, useEffect } from 'react';
import init, { transliterate as wasmTransliterate, assameseSchema, banglaSchema, hindiSchema } from '@unsigned/transliterator-wasm';

export interface TransliterationSchema {
  consonants: Record<string, string[]>;
  vowels: Record<string, string[]>;
  vowelMarks: Record<string, string[]>;
  specialChar: Record<string, string[]>;
  digits: Record<string, string[]>;
  exceptions: {
    specialCombinations: Record<string, string>;
    joinedConsonantsBefore: Record<string, string>;
    joinedConsonantsAfter: Record<string, string>;
    explicitHolonto: string;
  };
}

export interface Schemas {
  assamese: TransliterationSchema | null;
  bangla: TransliterationSchema | null;
  hindi: TransliterationSchema | null;
}

export function useTransliterator() {
  const [wasmReady, setWasmReady] = useState(false);
  const [schemas, setSchemas] = useState<Schemas>({
    assamese: null,
    bangla: null,
    hindi: null,
  });

  useEffect(() => {
    // Initialize WASM with explicit path to the wasm file
    const initWasm = async () => {
      try {
        // Load WASM from public directory
        await init('/transliterator_wasm_bg.wasm');
        console.log('WASM initialized successfully');
        setSchemas({
          assamese: assameseSchema(),
          bangla: banglaSchema(),
          hindi: hindiSchema(),
        });
        setWasmReady(true);
      } catch (err) {
        console.error('Failed to initialize WASM:', err);
      }
    };

    initWasm();
  }, []);

  // Wrapper function that only calls WASM transliterate when ready
  const transliterate = (text: string, schema: TransliterationSchema): string => {
    if (!wasmReady) {
      console.warn('WASM not ready yet');
      return text;
    }
    return wasmTransliterate(text, schema);
  };

  return { wasmReady, schemas, transliterate };
}

// For backward compatibility - export individual schemas
export { assameseSchema, banglaSchema, hindiSchema };
