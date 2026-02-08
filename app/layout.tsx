import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: {
    default: "V1 Drafts — Free Plagiarism Check for Medical Research Papers",
    template: "%s | V1 Drafts",
  },
  description:
    "AI-powered research writing tool for medical students in India. Free plagiarism checker, thesis writing software, paper search, citations, and AI detection.",
  keywords: [
    "free plagiarism check medical papers",
    "research paper writing tool",
    "thesis writing software India",
    "medical research assistant",
    "paper citation generator",
    "AI writing coach",
    "academic plagiarism checker",
  ],
  authors: [{ name: "V1 Drafts" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "V1 Drafts",
    title: "V1 Drafts — Free Plagiarism Check for Medical Research Papers",
    description:
      "AI-powered research writing tool for medical students in India. Free plagiarism checker, thesis writing software, paper search, citations, and AI detection.",
  },
  twitter: {
    card: "summary_large_image",
    title: "V1 Drafts — Free Plagiarism Check for Medical Research Papers",
    description:
      "AI-powered research writing tool for medical students in India. Free plagiarism checker, thesis writing software, paper search, citations, and AI detection.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://v1drafts.com"
  ),
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
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
