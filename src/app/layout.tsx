import type { Metadata } from "next";
import {
  Inter,
  Noto_Sans_JP,
  Newsreader,
  Noto_Serif_JP,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans-en",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const newsreader = Newsreader({
  variable: "--font-serif-en",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-serif-jp",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Eikaiwa Mate",
  description: "AIと英語で音声会話する英会話練習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansJp.variable} ${newsreader.variable} ${notoSerifJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
