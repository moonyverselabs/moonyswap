'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { formatTokenAmount, getSpotPrice, getTokenCost } from '@/lib/curve';
import { MOCK_MNY } from '@/lib/constants';
import { ReservePanel } from '@/components/ReservePanel';

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

// Check if string looks like a Solana address (base58, 32-44 chars)
function isValidSolanaAddress(str: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str.trim());
}

export default function HomePage() {
  const { reserves, loading, error, refresh } = useDiscoverReserves();
  const [search, setSearch] = useState('');
  const [searchMint, setSearchMint] = useState('');

  // Detect if search is a mint address
  useEffect(() => {
    const trimmed = search.trim();
    if (isValidSolanaAddress(trimmed)) {
      setSearchMint(trimmed);
    } else {
      setSearchMint('');
    }
  }, [search]);

  // Fetch token by mint if address detected
  const searchedToken = useReserveByMint(searchMint);
  const isSearchingMint = searchMint && searchedToken.loading;
  const foundByMint = searchMint && !searchedToken.loading && !searchedToken.error && searchedToken.name;

  const filteredReserves = reserves.filter(r => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      r.metadata.name.toLowerCase().includes(query) ||
      r.metadata.symbol.toLowerCase().includes(query) ||
      r.pool.currencyMint.toString().toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Construction Banner */}
      <div className="bg-amber-500/90 text-slate-900 text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Moonyswap</h1>
              <p className="text-sm text-slate-500">Decentralized Currency Exchange</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search markets..."
                  className="w-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {/* Autocomplete Dropdown */}
                {search && filteredReserves.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                    {filteredReserves.slice(0, 5).map((reserve) => (
                      <Link
                        key={reserve.pool.currencyMint.toString()}
                        href={`/token/${reserve.pool.currencyMint.toString()}`}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors"
                        onClick={() => setSearch('')}
                      >
                        {reserve.metadata.icon ? (
                          <img
                            src={reserve.metadata.icon}
                            alt={reserve.metadata.symbol}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {reserve.metadata.symbol.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{reserve.metadata.name}</p>
                          <p className="text-slate-500 text-xs">{reserve.metadata.symbol}</p>
                        </div>
                        <span className="text-slate-400 text-xs">{reserve.currentPriceFormatted}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Loading indicator for mint lookup */}
                {isSearchingMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 px-3 py-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Looking up token...
                    </div>
                  </div>
                )}
                {/* Found by mint address */}
                {foundByMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-emerald-500/50 rounded-lg shadow-xl z-20">
                    <Link
                      href={`/token/${searchMint}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors"
                      onClick={() => setSearch('')}
                    >
                      {searchedToken.icon ? (
                        <img
                          src={searchedToken.icon}
                          alt={searchedToken.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {searchedToken.symbol?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{searchedToken.name}</p>
                        <p className="text-slate-500 text-xs">{searchedToken.symbol}</p>
                      </div>
                      <span className="text-slate-400 text-xs">{searchedToken.currentPriceFormatted}</span>
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-800 text-slate-400 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? '...' : '↻'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trending Tokens Scroll */}
      {!loading && filteredReserves.length > 0 && !searchMint && !search && (
        <section className="border-b border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center">
            <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-3 border-r border-slate-800 z-10">
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Top 10</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex animate-marquee hover:pause-marquee">
                {/* Generate top 10 by looping if needed - rank is based on unique position */}
                {(() => {
                  const top10: { reserve: typeof filteredReserves[0]; rank: number }[] = [];
                  const maxItems = 10;
                  for (let i = 0; i < maxItems; i++) {
                    const originalIndex = i % filteredReserves.length;
                    top10.push({
                      reserve: filteredReserves[originalIndex],
                      rank: originalIndex + 1, // Rank based on unique position, not loop position
                    });
                  }
                  // Duplicate for seamless loop
                  const items = [...top10, ...top10];
                  return items.map((item, idx) => {
                    const milestone = getNextMilestone(
                      item.reserve.reserveBalance.toNumber(),
                      item.reserve.currentPrice.toNumber()
                    );
                    return (
                      <Link
                        key={`${item.reserve.pool.currencyMint.toString()}-${idx}`}
                        href={`/token/${item.reserve.pool.currencyMint.toString()}`}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-slate-800/50 transition-colors flex-shrink-0 border-r border-slate-800/50"
                      >
                        <span className="text-slate-500 text-xs font-medium w-5">#{item.rank}</span>
                        {item.reserve.metadata.icon ? (
                          <img
                            src={item.reserve.metadata.icon}
                            alt={item.reserve.metadata.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {item.reserve.metadata.symbol.charAt(0)}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">{item.reserve.metadata.symbol}</span>
                        <span className="text-slate-400 text-sm">{item.reserve.currentPriceFormatted}</span>
                        {milestone && (
                          <span className="text-green-400 text-xs font-medium">+{milestone.gain.toFixed(0)}%</span>
                        )}
                      </Link>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left: Branding & Copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm text-slate-500 uppercase tracking-widest mb-3">Decentralized Currency Exchange</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Your gateway to
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500"> digital economies</span>
              </h2>
              <p className="text-slate-400 max-w-lg leading-relaxed text-justify mb-5">
                Programmable currencies secured by Proof of Capital. Transparent on-chain reserves with guaranteed liquidity. Powered by Flipcash Protocol.
              </p>
              <Link
                href="/apps"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Discover where to use these currencies
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Right: Swap UI */}
            <div className="w-full lg:w-96">
              <ReservePanel />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Discovering reserves on-chain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">Error loading reserves</p>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredReserves.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400">
              {search ? 'No reserves match your search' : 'No reserves found'}
            </p>
          </div>
        )}

        {/* Token List */}
        {!loading && filteredReserves.length > 0 && (
          <div id="tokens" className="space-y-3 scroll-mt-20">
            {filteredReserves.map((reserve) => {
              const currentPrice = reserve.currentPrice.toNumber();
              const currentReserve = reserve.reserveBalance.toNumber();
              const milestone = getNextMilestone(currentReserve, currentPrice);
              const marketCap = reserve.currentPrice.multipliedBy(reserve.circulatingSupply);
              const isMockMny = MOCK_MNY.enabled && reserve.pool.currencyMint.toString() === MOCK_MNY.mockMint;

              return (
                <Link
                  key={reserve.pool.currencyMint.toString()}
                  href={`/token/${reserve.pool.currencyMint.toString()}`}
                  className="block bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Token Icon */}
                    {reserve.metadata.icon ? (
                      <img
                        src={reserve.metadata.icon}
                        alt={reserve.metadata.symbol}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {reserve.metadata.symbol.charAt(0)}
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {reserve.metadata.name}
                        </h3>
                        <span className="text-slate-500 text-sm">{reserve.metadata.symbol}</span>
                        {isMockMny && (
                          <span className="text-xs bg-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                          <span className="text-slate-500">Price:</span>{' '}
                          <span className="text-white">{reserve.currentPriceFormatted}</span>
                        </span>
                        <span className="text-slate-400">
                          <span className="text-slate-500">Reserve:</span>{' '}
                          <span className="text-white">{reserve.reserveBalanceFormatted}</span>
                        </span>
                        <span className="text-slate-400 hidden sm:inline">
                          <span className="text-slate-500">MCap:</span>{' '}
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
                          <div className="text-slate-500 text-xs">
                            to {milestone.label}
                          </div>
                        </div>
                      )}
                      <div
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Buy
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <h3 className="text-white font-semibold mb-2">Moonyswap</h3>
              <p className="text-slate-500 text-sm">
                Decentralized currency exchange powered by Flipcash Protocol.
              </p>
            </div>
            <a href="https://x.com/moonyswap" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @moonyswap
            </a>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} Moonyverse. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
