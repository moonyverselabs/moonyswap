'use client';

import { use } from 'react';
import Link from 'next/link';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { PriceCurveChart } from '@/components/PriceCurveChart';
import { ReservePanel } from '@/components/ReservePanel';
import { HoldingsPanel } from '@/components/HoldingsPanel';
import { TransactionHistory } from '@/components/TransactionHistory';
import { TrendingBar } from '@/components/TrendingBar';
import { Footer } from '@/components/Footer';
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
      <div className="min-h-screen bg-moony-subtle">
        <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-[#D8C5FD] transition-colors">
              Moonyswap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#D8C5FD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#a0a0a8]">Loading token data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (reserve.error) {
    return (
      <div className="min-h-screen bg-moony-subtle">
        <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-[#D8C5FD] transition-colors">
              Moonyswap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-8 text-center max-w-md">
            <p className="text-red-400 font-semibold text-lg">Token not found</p>
            <p className="text-[#a0a0a8] text-sm mt-2">{reserve.error}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-[#1a1a1f] hover:bg-[#2a2a30] text-white rounded-lg transition-colors"
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
    <div className="min-h-screen bg-moony-subtle">
      {/* Header */}
      <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-white hover:text-[#D8C5FD] transition-colors">
              Moonyswap
            </Link>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-[#FFF2D9] text-[#0c0c0f] px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-[#0c0c0f] rounded-full animate-pulse" />
              Beta
            </span>
          </div>
          {/* Right: Nav + Social */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/explore" className="px-3 py-1.5 text-sm font-medium text-white bg-[#1a1a1f] rounded-lg">
                Currencies
              </Link>
              <Link href="/apps" className="px-3 py-1.5 text-sm font-medium text-[#a0a0a8] hover:text-white hover:bg-[#1a1a1f] rounded-lg transition-colors">
                Apps
              </Link>
            </nav>
            <a
              href="https://x.com/moonyswap"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#1a1a1f] hover:bg-[#2a2a30] text-[#a0a0a8] hover:text-white rounded-lg transition-colors"
              title="Follow @moonyswap"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Trending Bar */}
      <TrendingBar currentMint={mint} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mock MNY Test Banner */}
        {isMockMny && (
          <div className="bg-[#D8C5FD]/10 border border-[#D8C5FD]/30 rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
            <span className="text-[#D8C5FD] text-sm">🧪</span>
            <span className="text-[#D8C5FD] text-sm">{MOCK_MNY.testLabel}</span>
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
            <div className="w-14 h-14 rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] text-xl font-bold">
              {reserve.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-moony-gradient">{reserve.name}</h1>
            <p className="text-[#a0a0a8] text-sm">{reserve.symbol}</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - 3/5 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#141418] rounded-xl p-4 border border-[#2a2a30]">
                <p className="text-xs text-[#707078] mb-1">Price</p>
                <p className="text-lg font-bold text-white">{reserve.currentPriceFormatted}</p>
              </div>
              <div className="bg-[#141418] rounded-xl p-4 border border-[#2a2a30]">
                <p className="text-xs text-[#707078] mb-1">Reserve</p>
                <p className="text-lg font-bold text-white">{reserve.reserveBalanceFormatted}</p>
              </div>
              <div className="bg-[#141418] rounded-xl p-4 border border-[#2a2a30]">
                <p className="text-xs text-[#707078] mb-1">Supply</p>
                <p className="text-lg font-bold text-white">{formatTokenAmount(reserve.circulatingSupply, 0)}</p>
                <p className="text-xs text-[#707078]">{supplyPercent.toFixed(4)}%</p>
              </div>
              <div className="bg-[#141418] rounded-xl p-4 border border-[#2a2a30]">
                <p className="text-xs text-[#707078] mb-1">Market Cap</p>
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

            {/* Transaction History */}
            <TransactionHistory
              poolAddress={reserve.pool.toString()}
              tokenMint={reserve.mint.toString()}
              tokenSymbol={reserve.symbol}
            />
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

            {/* Token Info */}
            <div className="bg-[#141418] rounded-xl p-5 border border-[#2a2a30]">
              <h3 className="text-moony-gradient font-semibold text-sm mb-3">Token Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#707078]">Mint</span>
                  <a
                    href={`https://solscan.io/token/${mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D8C5FD] hover:text-[#FFF2D9] font-mono text-xs"
                  >
                    {mint.slice(0, 6)}...{mint.slice(-4)}
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#707078]">Total Supply</span>
                  <span className="text-white">{formatTokenAmount(reserve.totalSupply, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#707078]">Decimals</span>
                  <span className="text-white">10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#707078]">Sell Fee</span>
                  <span className="text-white">1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
