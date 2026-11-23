import type { Metadata } from "next";
import Nav from "./nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "المكتب",
  description: "Virtual office — floor plan, task board, employee chat",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar">
      <body className="min-h-dvh bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <Nav />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
