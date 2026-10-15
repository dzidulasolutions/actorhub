"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconlyHide, IconlyShow } from "@/components/icons/iconly";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Connexion impossible");
        setBusy(false);
        return;
      }
      router.replace("/"); // la page d'accueil choisit entre onboarding et dashboard
    } catch {
      setError("Connexion impossible : vérifie ton réseau");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-card">
      {/* Panneau gauche (desktop) : même univers que l'onboarding */}
      <aside className="hidden w-105 shrink-0 flex-col justify-between bg-black p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center bg-highlight font-display text-lg text-black">A</div>
          <span className="font-display text-xl tracking-wide">ActorHub</span>
        </div>
        <p className="font-display text-2xl leading-snug text-white/90">
          Collect. Explore.
          <br />
          <span className="text-highlight">Export.</span>
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wider text-highlight">Accès privé</p>
            <h1 className="font-display text-4xl leading-tight">Entre ton code.</h1>
            <p className="text-sm text-muted-foreground">
              Cette application est protégée : elle utilise tes crédits Apify.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code d&apos;accès</Label>
            <div className="relative">
              <Input
                id="code"
                type={show ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="current-password"
                autoFocus
                aria-invalid={!!error}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Masquer le code" : "Afficher le code"}
                className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground"
              >
                {show ? <IconlyHide size={20} color="currentColor" /> : <IconlyShow size={20} color="currentColor" />}
              </button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <Button type="submit" disabled={busy || code.length === 0} className="h-11 w-full">
            {busy ? "Connexion…" : "Entrer"}
          </Button>
        </form>
      </main>
    </div>
  );
}