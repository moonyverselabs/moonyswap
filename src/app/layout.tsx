import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Moonyswap",
    template: "%s | Moonyswap",
  },
  description: "Decentralized currency exchange for programmable currencies. Trade with guaranteed liquidity powered by Flipcash Protocol.",
  metadataBase: new URL('https://moonyswap.com'),
  openGraph: {
    type: 'website',
    siteName: 'Moonyswap',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@moonyswap',
    creator: '@moonyswap',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
