"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { mergeTags } from "@/lib/profile-schema";

export function TagInput({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  max = 40,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [text, setText] = useState("");

  // Valide ce qui est en cours de saisie (aussi à la sortie du champ et au collage de plusieurs valeurs)
  function commit() {
    if (text.trim()) onChange(mergeTags(value, text, max));
    setText("");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap gap-1.5 border border-input bg-card p-2 focus-within:border-ring">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-accent px-2 py-1 text-sm text-primary">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Retirer ${tag}`}
              className="grid size-4 place-items-center hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && text === "" && value.length > 0) {
              onChange(value.slice(0, -1)); // Retour arrière sur un champ vide : retire la dernière étiquette
            }
          }}
          onBlur={commit}
          disabled={value.length >= max}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none disabled:cursor-not-allowed"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length >= max ? `Maximum atteint (${max}). ` : ""}
        {hint ?? "Valide avec Entrée ou une virgule."}
      </p>
    </div>
  );
}