import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mijote",
  description: "L'encyclopédie de plats, le planning et la liste de courses du foyer.",
  // Réglages propres à l'iPhone quand l'app est lancée depuis l'écran d'accueil.
  appleWebApp: {
    title: "Mijote",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E6A4C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
