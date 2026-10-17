"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT =
  ".pdf,.docx,.txt,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function CvImport({ busy, onFile }: { busy: boolean; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && !busy) onFile(file);
      }}
      className={cn(
        "flex flex-col items-center gap-2 border border-dashed p-6 text-center transition-colors",
        dragging ? "border-primary bg-accent" : "border-border"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        aria-label="Choisir un fichier de CV"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // permet de rechoisir le même fichier
          if (file) onFile(file);
        }}
      />
      <span className="grid size-10 place-items-center bg-black text-white">
        {busy ? <Loader2 className="size-5 animate-spin" /> : <FileUp className="size-5" />}
      </span>
      <p className="text-sm font-medium">{busy ? "Lecture du fichier…" : "Glisse ton CV ici"}</p>
      <p className="text-xs text-muted-foreground">PDF, Word (.docx) ou texte · 5 Mo maximum</p>
      <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()} className="h-9">
        Choisir un fichier
      </Button>
    </div>
  );
}