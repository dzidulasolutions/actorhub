// src/components/history/import-button.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_IMPORT_BYTES, parseExport } from "@/lib/parse-import";
import { hydrateSearch } from "@/lib/searches-store";

export function ImportButton({ onError }: { onError: (message: string | null) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de rechoisir le même fichier ensuite
    if (!file) return;

    onError(null);
    // Taille vérifiée AVANT de lire le contenu en mémoire
    if (file.size > MAX_IMPORT_BYTES) {
      onError(`Fichier trop volumineux (${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} Mo maximum)`);
      return;
    }

    setBusy(true);
    try {
      const result = parseExport(await file.text(), file.name);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      hydrateSearch(result.record); // en mémoire, comme une recherche de la session
      router.push(`/searches/${result.record.id}`);
    } catch {
      onError("Lecture du fichier impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
        aria-label="Choisir un fichier JSON exporté"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="h-9 gap-2"
      >
        <FolderOpen className="size-4" />
        {busy ? "Lecture…" : "Ouvrir un fichier"}
      </Button>
    </>
  );
}