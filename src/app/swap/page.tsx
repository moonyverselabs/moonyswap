'use client';

import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { formatUsd } from '@/lib/curve';
import { Footer } from '@/components/Footer';

export default function SwapPage() {
  const { reserves, loading } = useDiscoverReserves();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Construction Banner */}
      <div className="bg-amber-600 text-black text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
            Moonyswap
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← All Tokens
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Swap</h1>
          <p className="text-slate-400">
            Select a token to swap. You can pay with USDF or any other currency.
          </p>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-900 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800" />
                  <div className="flex-1">
                    <div className="h-5 w-24 bg-slate-800 rounded mb-2" />
                    <div className="h-4 w-16 bg-slate-800 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            reserves.map((reserve) => (
              <Link
                key={reserve.pool.currencyMint.toString()}
                href={`/token/${reserve.pool.currencyMint.toString()}`}
                className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  {reserve.metadata.icon ? (
                    <img
                      src={reserve.metadata.icon}
                      alt={reserve.metadata.symbol}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xl font-bold">
                      {reserve.metadata.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{reserve.metadata.name}</span>
                      <span className="text-slate-500 text-sm">{reserve.metadata.symbol}</span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {reserve.currentPriceFormatted} · Reserve: {reserve.reserveBalanceFormatted}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 text-sm font-medium">Swap →</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-900/50 rounded-xl p-5 border border-slate-800">
          <h3 className="font-semibold text-white text-sm mb-2">How swaps work</h3>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Pay with USDF for direct swaps (no routing fee)</li>
            <li>• Pay with any currency - routes through USDF (1% sell fee)</li>
            <li>• Sell to USDF or any other currency</li>
            <li>• All swaps have guaranteed liquidity from reserves</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
