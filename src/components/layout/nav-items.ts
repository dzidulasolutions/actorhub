import { Settings , Send, GraduationCap} from "lucide-react";
import {
  IconlyHome,
  IconlySearch,
  IconlyActivity,
  IconlyDocument,
  IconlyPaper,
  IconlyUser
} from "@/components/icons/iconly";

export const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: IconlyHome },
  { href: "/searches/new", label: "Nouvelle recherche", icon: IconlySearch },
  { href: "/actors", label: "Actors", icon: IconlyActivity },
  { href: "/results", label: "Résultats", icon: IconlyDocument },
  { href: "/searches", label: "Historique", icon: IconlyPaper },
    { href: "/tracking", label: "Suivi", icon: Send },
    { href: "/learn", label: "Apprendre", icon: GraduationCap },
] as const;

export const NAV_PREFS = [
  { href: "/profile", label: "Mon profil", icon: IconlyUser },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;