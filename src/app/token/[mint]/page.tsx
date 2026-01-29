'use client';

import { use } from 'react';
import Link from 'next/link';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { PriceCurveChart } from '@/components/PriceCurveChart';
import { ReservePanel } from '@/components/ReservePanel';
import { HoldingsPanel } from '@/components/HoldingsPanel';
import { formatTokenAmount } from '@/lib/curve';
import { MOCK_MNY } from '@/lib/constants';

interface PageProps {
  params: Promise<{ mint: string }>;
}

export default function TokenProfilePage({ params }: PageProps) {
  const { mint } = use(params);
  const reserve = useReserveByMint(mint);

  if (reserve.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              Moonyswap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading token data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (reserve.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              Moonyswap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center max-w-md">
            <p className="text-red-400 font-semibold text-lg">Token not found</p>
            <p className="text-gray-400 text-sm mt-2">{reserve.error}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Back to tokens
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supplyPercent = (reserve.circulatingSupply / reserve.totalSupply) * 100;
  const marketCap = reserve.currentPrice.multipliedBy(reserve.circulatingSupply);
  const isMockMny = MOCK_MNY.enabled && mint === MOCK_MNY.mockMint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Construction Banner */}
      <div className="bg-amber-600 text-black text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
            Moonyswap
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← All Tokens
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Mock MNY Test Banner */}
        {isMockMny && (
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
            <span className="text-purple-400 text-sm">🧪</span>
            <span className="text-purple-300 text-sm">{MOCK_MNY.testLabel}</span>
          </div>
        )}

        {/* Token Header */}
        <div className="flex items-center gap-4 mb-6">
          {reserve.icon ? (
            <img
              src={reserve.icon}
              alt={reserve.symbol}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold">
              {reserve.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{reserve.name}</h1>
            <p className="text-gray-400 text-sm">{reserve.symbol}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - 3/5 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="text-lg font-bold text-white">{reserve.currentPriceFormatted}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Reserve</p>
                <p className="text-lg font-bold text-white">{reserve.reserveBalanceFormatted}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Supply</p>
                <p className="text-lg font-bold text-white">{formatTokenAmount(reserve.circulatingSupply, 0)}</p>
                <p className="text-xs text-gray-600">{supplyPercent.toFixed(4)}%</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Market Cap</p>
                <p className="text-lg font-bold text-white">
                  ${marketCap.isLessThan(1000) ? marketCap.toFixed(2) : marketCap.toFormat(0)}
                </p>
              </div>
            </div>

            {/* Price Curve Chart */}
            <PriceCurveChart
              circulatingSupply={reserve.circulatingSupply}
              totalSupply={reserve.totalSupply}
              currentPrice={reserve.currentPrice}
              currentReserve={reserve.reserveBalance}
              symbol={reserve.symbol}
            />

            {/* Token Info + Bonding Curve side by side on larger screens */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-white font-semibold text-sm mb-3">Token Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Mint</span>
                    <a
                      href={`https://solscan.io/token/${mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-mono text-xs"
                    >
                      {mint.slice(0, 6)}...{mint.slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Supply</span>
                    <span className="text-white">{formatTokenAmount(reserve.totalSupply, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Decimals</span>
                    <span className="text-white">10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Sell Fee</span>
                    <span className="text-white">1%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="text-white font-semibold text-sm mb-3">Bonding Curve</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Price follows a deterministic curve from <span className="text-white">$0.01</span> to <span className="text-white">$1M</span>.
                  Buying increases price, selling decreases it. Reserve guarantees liquidity — no counterparty needed.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - 2/5 width */}
          <div className="lg:col-span-2 space-y-6">
            <ReservePanel tokenMint={mint} />
            <HoldingsPanel
              tokenMint={mint}
              tokenSymbol={reserve.symbol}
              currentPrice={reserve.currentPrice}
              currentReserve={reserve.reserveBalance}
              circulatingSupply={reserve.circulatingSupply}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          <p>Moonyswap · Powered by Flipcash · Moonyversal, LLC.</p>
        </div>
      </footer>
    </div>
  );
}
