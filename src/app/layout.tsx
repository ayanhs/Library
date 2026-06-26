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
  title: "AI Publishing Studio",
  description: "Create, publish, and manage your books with AI-powered tools",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
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
        style={{ backgroundColor: "#0a0a0f", color: "#f8fafc" }}
      >
        {children}
      </body>
    </html>
  );
}
