import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Plagiarism Check for Medical Research Papers",
  description:
    "Check your medical research paper for plagiarism — free, no signup required. Powered by Copyleaks, scanning against 60 trillion web pages and 16,000+ journals.",
  openGraph: {
    title: "Free Plagiarism Check — V1 Drafts",
    description:
      "Check your medical research paper for plagiarism — free, no signup required. Paste up to 1,000 words and get instant results.",
  },
};

export default function PlagiarismFreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
