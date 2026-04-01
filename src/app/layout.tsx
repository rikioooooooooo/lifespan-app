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
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "あと何秒、生きられる？",
    description: "36の問いから、あなたの残り時間を算出する。",
    type: "website",
    url: "https://nagaikisitaiyone.kosukuma.com",
    images: [
      {
        url: "https://nagaikisitaiyone.kosukuma.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "あと何秒、生きられる？",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "あと何秒、生きられる？",
    description: "36の問いから、あなたの残り時間を算出する。",
    images: ["https://nagaikisitaiyone.kosukuma.com/og-image.png"],
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
