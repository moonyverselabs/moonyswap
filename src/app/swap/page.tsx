'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ReservePanel } from "@/components/ReservePanel";
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const tokenMint = searchParams.get('token');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              Reserve
            </Link>
            <p className="text-sm text-gray-400">Flipcash Reserve Interface</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← All Tokens
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Interact with Any Reserve
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Buy and sell tokens directly from Flipcash Reserves.
            Guaranteed liquidity powered by deterministic bonding curves.
          </p>
        </div>

        <ReservePanel tokenKey="jeffy" tokenMint={tokenMint || undefined} />

        {/* Info Section */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-semibold text-white mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Prices follow a deterministic exponential curve from $0.01 to $1,000,000</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Buy with USDF to release tokens from the reserve</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Sell back to the reserve anytime (1% fee)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>All trades execute atomically onchain</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Open source interface for Flipcash Reserves</p>
          <p className="mt-1">Not affiliated with Flipcash Inc.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
