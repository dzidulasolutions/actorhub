
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

export const righteous = localFont({
  src: "../../public/fonts/Righteous-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-righteous",
  display: "swap",
});

export const googleSans = localFont({
  src: "../../public/fonts/GoogleSans.ttf",
  weight: "100 900",
  style: "normal",
  variable: "--font-google-sans",
  display: "swap",
});


export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});