import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peregrine Freight — Ops",
  description: "Internal operations console for Peregrine Freight.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // No `data-theme` here on purpose. The moment it is set, the plugin's
    // `:root:not([data-theme])` rule stops matching and the night shift loses
    // the automatic dark it was turned on for. The toggle writes it on click.
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
