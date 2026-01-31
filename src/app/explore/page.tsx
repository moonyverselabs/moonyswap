'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { getSpotPrice, getTokenCost } from '@/lib/curve';
import { MOCK_MNY } from '@/lib/constants';
import { isMockToken, getMockGradient } from '@/lib/mockTokens';
import { TrendingBar } from '@/components/TrendingBar';
import { Footer } from '@/components/Footer';

// Helper: find supply at a given reserve
function supplyAtReserve(targetReserve: number): number {
  let low = 0, high = 21_000_000;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const res = getTokenCost(0, mid).toNumber();
    if (res < targetReserve) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// Get the next milestone and calculate gain
function getNextMilestone(currentReserve: number, currentPrice: number) {
  const milestones = [100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000];
  const nextMilestone = milestones.find(m => m > currentReserve);

  if (!nextMilestone) return null;

  const supplyAtMilestone = supplyAtReserve(nextMilestone);
  const priceAtMilestone = getSpotPrice(supplyAtMilestone).toNumber();
  const gain = ((priceAtMilestone - currentPrice) / currentPrice) * 100;

  const label = nextMilestone >= 1_000_000
    ? `$${nextMilestone / 1_000_000}M`
    : nextMilestone >= 1_000
    ? `$${nextMilestone / 1_000}K`
    : `$${nextMilestone}`;

  return { milestone: nextMilestone, label, gain };
}

const PAGE_SIZE = 50;

export default function ExplorePage() {
  const { reserves, loading, error, refresh } = useDiscoverReserves();
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredReserves = reserves.filter(r => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      r.metadata.name.toLowerCase().includes(query) ||
      r.metadata.symbol.toLowerCase().includes(query)
    );
  });

  // Reset visible count when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  // Show currencies up to visibleCount
  const displayReserves = filteredReserves.slice(0, visibleCount);
  const hasMore = filteredReserves.length > visibleCount;

  return (
    <div className="min-h-screen bg-moony-subtle">
      {/* Header */}
      <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            {/* Right: Nav + Search + Social */}
            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-1">
                <span className="px-3 py-1.5 text-sm font-medium text-white bg-[#1a1a1f] rounded-lg">
                  Currencies
                </span>
                <Link href="/apps" className="px-3 py-1.5 text-sm font-medium text-[#a0a0a8] hover:text-white hover:bg-[#1a1a1f] rounded-lg transition-colors">
                  Apps
                </Link>
              </nav>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search..."
                className="hidden md:block w-48 px-3 py-1.5 bg-[#141418] border border-[#2a2a30] rounded-lg text-white text-sm placeholder-[#a0a0a8] focus:outline-none focus:border-[#D8C5FD] transition-colors"
              />
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
        </div>
      </header>

      {/* Trending Bar */}
      <TrendingBar />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-[#D8C5FD] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#a0a0a8]">Loading currencies...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">Error loading currencies</p>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayReserves.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#a0a0a8]">
              {search ? 'No currencies match your search' : 'No currencies found'}
            </p>
          </div>
        )}

        {/* Currency List */}
        {!loading && displayReserves.length > 0 && (
          <div className="space-y-3">
            {displayReserves.map((reserve, index) => {
              const currentPrice = reserve.currentPrice.toNumber();
              const currentReserve = reserve.reserveBalance.toNumber();
              const milestone = getNextMilestone(currentReserve, currentPrice);
              const marketCap = reserve.currentPrice.multipliedBy(reserve.circulatingSupply);
              const mintStr = reserve.pool.currencyMint.toString();
              const isMock = mintStr === MOCK_MNY.mockMint || mintStr.startsWith('MOCK_');

              return (
                <Link
                  key={reserve.pool.currencyMint.toString()}
                  href={`/token/${reserve.pool.currencyMint.toString()}`}
                  className="block bg-[#141418] hover:bg-[#1a1a1f] border border-[#2a2a30] hover:border-[#D8C5FD]/50 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 text-center text-[#707078] text-sm font-medium">
                      #{index + 1}
                    </div>

                    {/* Token Icon */}
                    {reserve.metadata.icon ? (
                      <img
                        src={reserve.metadata.icon}
                        alt={reserve.metadata.symbol}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    ) : isMock ? (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                        style={{ background: getMockGradient(reserve.metadata.symbol) }}
                      >
                        {reserve.metadata.symbol.charAt(0)}
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] text-lg font-bold flex-shrink-0">
                        {reserve.metadata.symbol.charAt(0)}
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {reserve.metadata.name}
                        </h3>
                        <span className="text-[#a0a0a8] text-sm">{reserve.metadata.symbol}</span>
                        {isMock && (
                          <span className="text-xs bg-[#FFF2D9]/20 text-[#FFF2D9] px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#a0a0a8]">
                          <span className="text-[#707078]">Price:</span>{' '}
                          <span className="text-white">{reserve.currentPriceFormatted}</span>
                        </span>
                        <span className="text-[#a0a0a8]">
                          <span className="text-[#707078]">Reserve:</span>{' '}
                          <span className="text-white">{reserve.reserveBalanceFormatted}</span>
                        </span>
                        <span className="text-[#a0a0a8] hidden sm:inline">
                          <span className="text-[#707078]">MCap:</span>{' '}
                          <span className="text-white">
                            ${marketCap.isLessThan(1000) ? marketCap.toFixed(2) : marketCap.toFormat(0)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Milestone Gain + Buy Button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {milestone && (
                        <div className="text-right">
                          <div className="text-green-400 font-semibold">
                            +{milestone.gain.toFixed(0)}%
                          </div>
                          <div className="text-[#707078] text-xs">
                            to {milestone.label}
                          </div>
                        </div>
                      )}
                      <div className="btn-moony px-4 py-2 rounded-lg text-sm transition-colors">
                        Buy
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {!loading && displayReserves.length > 0 && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="text-[#707078] text-sm">
              Showing {displayReserves.length} of {filteredReserves.length} currencies
            </div>
            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="px-6 py-3 bg-[#1a1a1f] hover:bg-[#2a2a30] border border-[#2a2a30] hover:border-[#D8C5FD]/50 text-white font-medium rounded-xl transition-all"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
