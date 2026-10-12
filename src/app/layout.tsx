import type { Metadata } from "next";
import { righteous, googleSans, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: { default: "ActorHub", template: "%s · ActorHub" },
  description: "Collect. Explore. Export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Les 3 variables CSS sont posées sur <html> pour être dispo partout
    <html
      lang="fr"
      className={cn(righteous.variable, googleSans.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}