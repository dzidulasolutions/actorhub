import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileHeader } from "@/components/layout/mobile-header";

// Coquille de l'app : sidebar sur fond gris + grande carte blanche arrondie (style Preforge)
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gap-3 p-0 lg:h-screen lg:p-3">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 py-2 lg:flex">
        <Logo />
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-card lg:rounded-2xl lg:border lg:border-border lg:shadow-card">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}