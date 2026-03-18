import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athanor Explorer",
  description: "Visualize and explore identity portraits",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
