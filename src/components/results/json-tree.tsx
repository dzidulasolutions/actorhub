const MAX_ITEMS = 50; // au-delà, on renvoie vers le JSON brut
const MAX_DEPTH = 6;

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

// Valeur "vide" : null, texte vide, liste ou objet vide (sert à masquer le bruit)
export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

// Affiche une valeur JSON ; objets et listes sont dépliables (<details> natif).
// Tout est rendu comme du TEXTE : jamais de HTML issu des résultats.
export function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">null</span>;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return <span className="font-mono text-xs">{String(value)}</span>;
  }
  if (typeof value === "string") {
    return value === "" ? (
      <span className="text-muted-foreground">(vide)</span>
    ) : (
      <span className="wrap-words [wrap-anywhere]">{value}</span>
    );
  }
  if (depth >= MAX_DEPTH) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {JSON.stringify(value).slice(0, 200)}…
      </span>
    );
  }

  const isList = Array.isArray(value);
  const entries: [string, unknown][] = isList
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) {
    return <span className="text-muted-foreground">{isList ? "liste vide" : "objet vide"}</span>;
  }

  return (
    <details>
      <summary className="cursor-pointer select-none text-primary hover:underline">
        {isList ? `Liste · ${plural(entries.length, "élément")}` : `Objet · ${plural(entries.length, "champ")}`}
      </summary>
      <dl className="mt-2 space-y-2 border-l border-border pl-3">
        {entries.slice(0, MAX_ITEMS).map(([k, v]) => (
          <div key={k} className="grid gap-1 sm:grid-cols-[minmax(0,140px)_1fr]">
            <dt className="wrap-words font-mono text-xs text-muted-foreground">{k}</dt>
            <dd className="min-w-0 text-sm">
              <JsonValue value={v} depth={depth + 1} />
            </dd>
          </div>
        ))}
        {entries.length > MAX_ITEMS && (
          <p className="text-xs text-muted-foreground">
            … {entries.length - MAX_ITEMS} autres éléments (voir le JSON brut)
          </p>
        )}
      </dl>
    </details>
  );
}