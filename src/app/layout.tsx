import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokenomics — the Pokémon card market, tracked like an index",
  description:
    "Live TCGPlayer near-mint prices for modern (2020+) Pokémon cards, grouped into set and character indices with price history and market statistics.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT = `
try {
  var t = localStorage.getItem('pokenomics-theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-page text-text-primary antialiased">
        <Header />
        <main className="mx-auto min-h-[calc(100vh-56px)] max-w-5xl px-4 pb-24 pt-4 sm:px-6 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
