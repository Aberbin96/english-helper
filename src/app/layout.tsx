import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "English Helper",
  description: "B1→B2 daily study tracker",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>
          <Nav />
          <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
