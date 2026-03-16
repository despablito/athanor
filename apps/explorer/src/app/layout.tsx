import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athanor Explorer",
  description: "Explore and visualize code transformations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
