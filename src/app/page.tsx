'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { formatTokenAmount, getSpotPrice, getTokenCost } from '@/lib/curve';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Construction Banner */}
      <div className="bg-amber-600 text-black text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">MoonySwap</h1>
              <p className="text-sm text-gray-400">Social Token Exchange</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                {/* Autocomplete Dropdown */}
                {search && filteredReserves.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                    {filteredReserves.slice(0, 5).map((reserve) => (
                      <Link
                        key={reserve.pool.address.toString()}
                        href={`/token/${reserve.pool.currencyMint.toString()}`}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors"
                        onClick={() => setSearch('')}
                      >
                        {reserve.metadata.icon ? (
                          <img
                            src={reserve.metadata.icon}
                            alt={reserve.metadata.symbol}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {reserve.metadata.symbol.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{reserve.metadata.name}</p>
                          <p className="text-gray-500 text-xs">{reserve.metadata.symbol}</p>
                        </div>
                        <span className="text-gray-400 text-xs">{reserve.currentPriceFormatted}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Loading indicator for mint lookup */}
                {isSearchingMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 px-3 py-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      Looking up token...
                    </div>
                  </div>
                )}
                {/* Found by mint address */}
                {foundByMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-purple-500/50 rounded-lg shadow-xl z-20">
                    <Link
                      href={`/token/${searchMint}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors"
                      onClick={() => setSearch('')}
                    >
                      {searchedToken.icon ? (
                        <img
                          src={searchedToken.icon}
                          alt={searchedToken.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {searchedToken.symbol?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{searchedToken.name}</p>
                        <p className="text-gray-500 text-xs">{searchedToken.symbol}</p>
                      </div>
                      <span className="text-gray-400 text-xs">{searchedToken.currentPriceFormatted}</span>
                    </Link>
                  </div>
                )}
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? '...' : '↻'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trending Tokens Scroll */}
      {!loading && filteredReserves.length > 0 && !searchMint && (
        <section className="border-b border-gray-800 bg-gray-900/50">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 uppercase tracking-wide flex-shrink-0">
                {search ? `${filteredReserves.length} found` : 'Trending'}
              </span>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {filteredReserves.map((reserve) => {
                  const milestone = getNextMilestone(
                    reserve.reserveBalance.toNumber(),
                    reserve.currentPrice.toNumber()
                  );
                  return (
                    <Link
                      key={reserve.pool.address.toString()}
                      href={`/token/${reserve.pool.currencyMint.toString()}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                    >
                      {reserve.metadata.icon ? (
                        <img
                          src={reserve.metadata.icon}
                          alt={reserve.metadata.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {reserve.metadata.symbol.charAt(0)}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{reserve.metadata.symbol}</span>
                      <span className="text-gray-400 text-sm">{reserve.currentPriceFormatted}</span>
                      {milestone && (
                        <span className="text-green-400 text-xs">+{milestone.gain.toFixed(0)}%</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Discovering reserves on-chain...</p>
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
            <p className="text-gray-400">
              {search ? 'No reserves match your search' : 'No reserves found'}
            </p>
          </div>
        )}

        {/* Token List */}
        {!loading && filteredReserves.length > 0 && (
          <div className="space-y-3">
            {filteredReserves.map((reserve) => {
              const currentPrice = reserve.currentPrice.toNumber();
              const currentReserve = reserve.reserveBalance.toNumber();
              const milestone = getNextMilestone(currentReserve, currentPrice);
              const marketCap = reserve.currentPrice.multipliedBy(reserve.circulatingSupply);

              return (
                <Link
                  key={reserve.pool.address.toString()}
                  href={`/token/${reserve.pool.currencyMint.toString()}`}
                  className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 transition-all"
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
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {reserve.metadata.symbol.charAt(0)}
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {reserve.metadata.name}
                        </h3>
                        <span className="text-gray-500 text-sm">{reserve.metadata.symbol}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">
                          <span className="text-gray-500">Price:</span>{' '}
                          <span className="text-white">{reserve.currentPriceFormatted}</span>
                        </span>
                        <span className="text-gray-400">
                          <span className="text-gray-500">Reserve:</span>{' '}
                          <span className="text-white">{reserve.reserveBalanceFormatted}</span>
                        </span>
                        <span className="text-gray-400 hidden sm:inline">
                          <span className="text-gray-500">MCap:</span>{' '}
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
                          <div className="text-gray-500 text-xs">
                            to {milestone.label}
                          </div>
                        </div>
                      )}
                      <div
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
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

        {/* Stats Summary */}
        {!loading && filteredReserves.length > 0 && (
          <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex flex-wrap justify-center gap-8 text-center text-sm">
              <div>
                <span className="text-white font-medium">{reserves.length}</span>
                <span className="text-gray-500 ml-1">reserves</span>
              </div>
              <div>
                <span className="text-white font-medium">
                  ${reserves.reduce((sum, r) => sum + r.reserveBalance.toNumber(), 0).toFixed(2)}
                </span>
                <span className="text-gray-500 ml-1">total locked</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>MoonySwap · Powered by Flipcash · Moonyversal, LLC.</p>
        </div>
      </footer>
    </div>
  );
}
