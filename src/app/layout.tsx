import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dossier",
  description:
    "A private, evidence-first research workspace for turning scattered sources into defensible, source-backed briefs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
