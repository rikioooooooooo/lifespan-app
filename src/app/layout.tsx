import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600"],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  weight: ["200", "300", "400"],
});

export const metadata: Metadata = {
  title: "あと何秒、生きられる？",
  description: "36の問いから、あなたの残り時間を算出する。",
  openGraph: {
    title: "あと何秒、生きられる？",
    description: "36の問いから、あなたの残り時間を算出する。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "あと何秒、生きられる？",
    description: "36の問いから、あなたの残り時間を算出する。",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${spaceGrotesk.variable} ${notoSansJP.variable}`}>
      <body className="font-[family-name:var(--font-jp)] min-h-screen">
        {children}
      </body>
    </html>
  );
}
