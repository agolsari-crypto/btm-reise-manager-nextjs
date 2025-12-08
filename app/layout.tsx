import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTM Reise-Manager | NEVPAZ",
  description: "BTM-Bescheinigungen für Reisen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
