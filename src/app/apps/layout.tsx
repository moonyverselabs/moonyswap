import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps",
  description: "Discover apps, games, and platforms building real economies with programmable currencies on Flipcash Protocol.",
  openGraph: {
    title: "App Ecosystem | Moonyswap",
    description: "Discover apps, games, and platforms building real economies with programmable currencies on Flipcash Protocol.",
  },
};

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
