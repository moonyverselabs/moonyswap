'use client';

import { use } from 'react';
import Link from 'next/link';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { PriceCurveChart } from '@/components/PriceCurveChart';
import { ReservePanel } from '@/components/ReservePanel';
import { formatTokenAmount } from '@/lib/curve';

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
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              MoonySwap
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
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
              MoonySwap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center max-w-md">
            <p className="text-red-400 font-semibold text-lg">Token not found</p>
            <p className="text-red-300 text-sm mt-2">{reserve.error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Construction Banner */}
      <div className="bg-amber-600 text-black text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
            MoonySwap
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← All Tokens
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Token Header */}
        <div className="flex items-center gap-4 mb-8">
          {reserve.icon ? (
            <img
              src={reserve.icon}
              alt={reserve.symbol}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
              {reserve.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{reserve.name}</h1>
            <p className="text-gray-400">{reserve.symbol}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Current Price</p>
            <p className="text-xl font-bold text-white">{reserve.currentPriceFormatted}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Reserve Balance</p>
            <p className="text-xl font-bold text-white">{reserve.reserveBalanceFormatted}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Circulating Supply</p>
            <p className="text-xl font-bold text-white">{formatTokenAmount(reserve.circulatingSupply, 0)}</p>
            <p className="text-xs text-gray-500">{supplyPercent.toFixed(4)}% released</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Market Cap</p>
            <p className="text-xl font-bold text-white">
              ${marketCap.isLessThan(1000)
                ? marketCap.toFixed(2)
                : marketCap.toFormat(0)
              }
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Chart and Info */}
          <div className="space-y-6">
            {/* Price Curve Chart */}
            <PriceCurveChart
              circulatingSupply={reserve.circulatingSupply}
              totalSupply={reserve.totalSupply}
              currentPrice={reserve.currentPrice}
              currentReserve={reserve.reserveBalance}
              symbol={reserve.symbol}
            />

            {/* Token Info */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Token Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Mint Address</span>
                  <a
                    href={`https://solscan.io/token/${mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm font-mono truncate max-w-[200px]"
                  >
                    {mint.slice(0, 8)}...{mint.slice(-8)}
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="text-white">{formatTokenAmount(reserve.totalSupply, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Decimals</span>
                  <span className="text-white">10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sell Fee</span>
                  <span className="text-white">1%</span>
                </div>
              </div>
            </div>

            {/* Curve Mechanics */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Bonding Curve</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The price follows a deterministic exponential curve from <span className="text-white">$0.01</span> at
                0 supply to <span className="text-white">$1,000,000</span> at max supply.
                As tokens are bought from the reserve, the price increases along this fixed curve.
                Selling returns tokens to the reserve and decreases the price.
                The reserve always has guaranteed liquidity — no counterparty needed.
              </p>
            </div>
          </div>

          {/* Right: Swap Panel */}
          <div>
            <ReservePanel tokenMint={mint} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>MoonySwap · Powered by Flipcash · Moonyversal, LLC.</p>
        </div>
      </footer>
    </div>
  );
}
