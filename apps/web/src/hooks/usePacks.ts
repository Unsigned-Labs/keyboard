"use client";

import { useEffect, useState } from "react";
import init, { PackStore } from "@unsigned/transliterator-wasm";
import { ensurePack, typingInputMethods, type PackIndexEntry } from "@/lib/packs";

let storePromise: Promise<PackStore> | null = null;

function getStore(): Promise<PackStore> {
  storePromise ??= init("/transliterator_wasm_bg.wasm").then(() => new PackStore());
  return storePromise;
}

/**
 * The page's pack store and the typing input methods it can offer. `ready` turns true once the
 * selected input method and its transliteration and dictionary are loaded.
 */
export function usePacks(inputMethodId: string | null) {
  const [store, setStore] = useState<PackStore | null>(null);
  const [inputMethods, setInputMethods] = useState<PackIndexEntry[]>([]);
  const [readyId, setReadyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStore(), typingInputMethods()])
      .then(([s, ims]) => {
        if (cancelled) return;
        setStore(s);
        setInputMethods(ims);
      })
      .catch((err) => console.error("Failed to load packs:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!store || !inputMethodId) return;
    let cancelled = false;
    ensurePack(store, inputMethodId)
      .then(() => !cancelled && setReadyId(inputMethodId))
      .catch((err) => console.error(`Failed to load ${inputMethodId}:`, err));
    return () => {
      cancelled = true;
    };
  }, [store, inputMethodId]);

  return { store, inputMethods, ready: store !== null && readyId === inputMethodId };
}
