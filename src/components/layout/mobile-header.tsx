"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

// Visible uniquement sous 1024px (lg:hidden) : la sidebar devient un tiroir
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
      <Logo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Ouvrir le menu"
          className="grid size-10 place-items-center rounded-lg border border-border hover:bg-muted"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="flex w-72 flex-col gap-6 bg-background p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo />
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}