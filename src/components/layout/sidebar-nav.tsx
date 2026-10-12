"use client"; // usePathname exige un composant client

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_MAIN, NAV_PREFS } from "./nav-items";

type Item = (typeof NAV_MAIN)[number] | (typeof NAV_PREFS)[number];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // Actif si l'URL correspond exactement ou est une sous-page.
  // Cas particulier : /searches ne doit pas s'allumer sur /searches/new.
  const isActive = (href: string) =>
    href === "/searches"
      ? pathname === "/searches"
      : pathname === href || pathname.startsWith(`${href}/`);

  const renderItem = ({ href, label, icon: Icon }: Item) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate} // ferme le menu mobile après un clic
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 border border-transparent px-3 py-2 text-sm transition-colors",
          active
            ? "border-border bg-card font-medium text-foreground"
            : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
        )}
      >
        {/* L'icône prend la couleur du texte (currentColor) ; bleue si active */}
        <span className={active ? "text-primary" : ""}>
          <Icon size={20} />
        </span>
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navigation principale">
      <div className="space-y-1">
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {NAV_MAIN.map(renderItem)}
      </div>
      <div className="space-y-1">
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Préférences
        </p>
        {NAV_PREFS.map(renderItem)}
      </div>
    </nav>
  );
}