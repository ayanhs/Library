import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/design-system.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Publishing Studio — Write Your Book with AI",
  description:
    "Go from story idea to publish-ready manuscript. AI blueprint, chapter writing, story bible, editor, cover art, and PDF/DOCX/EPUB export.",
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
        style={{ backgroundColor: "#0f1115", color: "#e8eaed" }}
      >
        {children}
      </body>
    </html>
  );
}
