import type { Metadata } from "next";
// Import Inter instead of Geist (which is having download issues)
import { Inter } from "next/font/google";
import "./globals.css";

// Use Inter as a fallback since Geist is failing
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Design Competition Judging Panel",
  description: "Official judging platform for the design competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}