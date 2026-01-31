import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Currencies",
  description: "Explore all programmable currencies on Moonyswap. Backed by Proof of Capital with guaranteed liquidity.",
  openGraph: {
    title: "Explore Currencies | Moonyswap",
    description: "Explore all programmable currencies on Moonyswap. Backed by Proof of Capital with guaranteed liquidity.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
