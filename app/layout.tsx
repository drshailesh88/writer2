import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "V1 Drafts — All research needs met under one single roof",
  description:
    "AI-powered research writing assistant for medical students. Learn to write research papers with guided coaching or draft them faster with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            JavaScript is required to use V1 Drafts. Please enable JavaScript in
            your browser settings.
          </div>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
