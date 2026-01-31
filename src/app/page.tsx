'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { formatTokenAmount, getSpotPrice, getTokenCost } from '@/lib/curve';
import { MOCK_MNY } from '@/lib/constants';
import { isMockToken, getMockGradient } from '@/lib/mockTokens';
import { ReservePanel } from '@/components/ReservePanel';
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
    <div className="min-h-screen bg-moony-subtle">
      {/* Header */}
      <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Moonyswap</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-[#FFF2D9] text-[#0c0c0f] px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 bg-[#0c0c0f] rounded-full animate-pulse" />
                Beta
              </span>
            </div>
            {/* Right: Nav + Search + Social */}
            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/explore" className="px-3 py-1.5 text-sm font-medium text-[#a0a0a8] hover:text-white hover:bg-[#1a1a1f] rounded-lg transition-colors">
                  Currencies
                </Link>
                <Link href="/apps" className="px-3 py-1.5 text-sm font-medium text-[#a0a0a8] hover:text-white hover:bg-[#1a1a1f] rounded-lg transition-colors">
                  Apps
                </Link>
              </nav>
              <div className="relative hidden md:block">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-48 px-3 py-1.5 bg-[#141418] border border-[#2a2a30] rounded-lg text-white text-sm placeholder-[#a0a0a8] focus:outline-none focus:border-[#D8C5FD] transition-colors"
                />
                {/* Autocomplete Dropdown */}
                {search && filteredReserves.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#141418] border border-[#2a2a30] rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                    {filteredReserves.slice(0, 5).map((reserve) => (
                      <Link
                        key={reserve.pool.currencyMint.toString()}
                        href={`/token/${reserve.pool.currencyMint.toString()}`}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a1f] transition-colors"
                        onClick={() => setSearch('')}
                      >
                        {reserve.metadata.icon ? (
                          <img
                            src={reserve.metadata.icon}
                            alt={reserve.metadata.symbol}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] text-xs font-bold">
                            {reserve.metadata.symbol.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{reserve.metadata.name}</p>
                          <p className="text-[#a0a0a8] text-xs">{reserve.metadata.symbol}</p>
                        </div>
                        <span className="text-[#a0a0a8] text-xs">{reserve.currentPriceFormatted}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {/* Loading indicator for mint lookup */}
                {isSearchingMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#141418] border border-[#2a2a30] rounded-lg shadow-xl z-20 px-3 py-3">
                    <div className="flex items-center gap-2 text-[#a0a0a8] text-sm">
                      <div className="w-4 h-4 border-2 border-[#D8C5FD] border-t-transparent rounded-full animate-spin" />
                      Looking up token...
                    </div>
                  </div>
                )}
                {/* Found by mint address */}
                {foundByMint && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1f] border border-[#D8C5FD]/50 rounded-lg shadow-xl z-20">
                    <Link
                      href={`/token/${searchMint}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a1f] transition-colors"
                      onClick={() => setSearch('')}
                    >
                      {searchedToken.icon ? (
                        <img
                          src={searchedToken.icon}
                          alt={searchedToken.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] text-xs font-bold">
                          {searchedToken.symbol?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{searchedToken.name}</p>
                        <p className="text-[#a0a0a8] text-xs">{searchedToken.symbol}</p>
                      </div>
                      <span className="text-[#a0a0a8] text-xs">{searchedToken.currentPriceFormatted}</span>
                    </Link>
                  </div>
                )}
              </div>
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

      {/* Trending Tokens Scroll */}
      {!loading && filteredReserves.length > 0 && !searchMint && !search && (
        <section className="border-b border-[#2a2a30] bg-[#141418]/50 overflow-hidden">
          <div className="flex items-center">
            <div className="bg-[#141418]/80 backdrop-blur-sm px-4 py-3 border-r border-[#2a2a30] z-10">
              <span className="text-xs text-[#a0a0a8] uppercase tracking-wide font-medium">Top 10</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex animate-marquee hover:pause-marquee">
                {/* Top 10 unique tokens */}
                {(() => {
                  const top10 = filteredReserves.slice(0, 10).map((reserve, index) => ({
                    reserve,
                    rank: index + 1,
                  }));
                  // Duplicate for seamless marquee loop
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
                        className="flex items-center gap-2 px-4 py-3 hover:bg-[#1a1a1f]/50 transition-colors flex-shrink-0 border-r border-[#2a2a30]/50"
                      >
                        <span className="text-[#a0a0a8] text-xs font-medium w-5">#{item.rank}</span>
                        {item.reserve.metadata.icon ? (
                          <img
                            src={item.reserve.metadata.icon}
                            alt={item.reserve.metadata.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : isMockToken(item.reserve.pool.currencyMint.toString()) ? (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: getMockGradient(item.reserve.metadata.symbol) }}
                          >
                            {item.reserve.metadata.symbol.charAt(0)}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] text-xs font-bold">
                            {item.reserve.metadata.symbol.charAt(0)}
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">{item.reserve.metadata.symbol}</span>
                        <span className="text-[#a0a0a8] text-sm">{item.reserve.currentPriceFormatted}</span>
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
      <section className="border-b border-[#2a2a30]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left: Branding & Copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm text-[#a0a0a8] uppercase tracking-widest mb-3">Decentralized Currency Exchange</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-moony-gradient mb-4 leading-tight">
                Your gateway to digital economies
              </h2>
              <p className="text-[#a0a0a8] max-w-lg leading-relaxed text-justify">
                Programmable currencies secured by Proof of Capital. Transparent on-chain reserves with guaranteed liquidity. Powered by Flipcash Protocol.
              </p>
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
            <div className="inline-block w-8 h-8 border-4 border-[#D8C5FD] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#a0a0a8]">Discovering reserves on-chain...</p>
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
            <p className="text-[#a0a0a8]">
              {search ? 'No reserves match your search' : 'No reserves found'}
            </p>
          </div>
        )}

        {/* Token List - Top 5 */}
        {!loading && filteredReserves.length > 0 && (
          <div id="tokens" className="space-y-3 scroll-mt-20">
            {filteredReserves.slice(0, 5).map((reserve) => {
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

            {/* Explore All Button */}
            {filteredReserves.length > 5 && (
              <div className="flex justify-center pt-4">
                <Link
                  href="/explore"
                  className="px-6 py-3 bg-[#1a1a1f] hover:bg-[#2a2a30] border border-[#2a2a30] hover:border-[#D8C5FD]/50 text-white font-medium rounded-xl transition-all"
                >
                  Explore All Currencies
                </Link>
              </div>
            )}

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center pt-8 text-[#707078]">
              <span className="text-sm mb-2">Scroll to learn more</span>
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

      </main>

      {/* Protocol Stats Section */}
      <section className="border-t border-[#2a2a30] bg-[#0c0c0f]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
            {/* Left: Copy */}
            <div className="flex-1">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                Proof of Capital.<br />
                Always liquid.
              </h2>
              <p className="text-[#a0a0a8] text-lg mb-4 leading-relaxed">
                Every currency on Moonyswap is backed by transparent on-chain reserves. No order books, no counterparty risk.
              </p>
              <p className="text-[#a0a0a8] text-lg mb-8 leading-relaxed">
                Buy and sell instantly at mathematically-determined prices. Your liquidity is guaranteed by the protocol.
              </p>
              <Link
                href="/apps"
                className="inline-flex items-center gap-2 text-white font-medium hover:text-[#D8C5FD] transition-colors"
              >
                Explore the ecosystem
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Right: Stats Panel */}
            <div className="w-full lg:w-auto">
              <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#2a2a30] flex items-center gap-2">
                  <img src="/flipcash.jpg" alt="Flipcash" className="w-5 h-5 rounded" />
                  <span className="text-[#D8C5FD] font-medium">Flipcash Protocol Stats</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2">
                  <div className="px-6 py-6 border-r border-b border-[#2a2a30]">
                    <p className="text-[#a0a0a8] text-sm mb-2">Total Value Locked</p>
                    <p className="text-white text-3xl font-bold">
                      {loading ? '...' : `$${(reserves.reduce((sum, r) => sum + r.reserveBalance.toNumber(), 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                  </div>
                  <div className="px-6 py-6 border-b border-[#2a2a30]">
                    <p className="text-[#a0a0a8] text-sm mb-2">Currencies</p>
                    <p className="text-white text-3xl font-bold">
                      {loading ? '...' : reserves.length}
                    </p>
                  </div>
                  <div className="px-6 py-6 border-r border-[#2a2a30]">
                    <p className="text-[#a0a0a8] text-sm mb-2">Protocol Fee</p>
                    <p className="text-white text-3xl font-bold">1%</p>
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-green-400 text-sm mb-2">Guaranteed Liquidity</p>
                    <p className="text-green-400 text-3xl font-bold">100%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="border-t border-[#2a2a30]">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-12">
            Built for digital economies
          </h2>

          {/* Featured: Get the Flipcash App - Full Width */}
          <div className="bg-gradient-to-br from-[#D8C5FD]/10 to-[#FFF2D9]/5 border border-[#D8C5FD]/30 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <img src="/flipcash.jpg" alt="Flipcash" className="w-16 h-16 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#D8C5FD] font-medium text-sm">Mobile App</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-moony-gradient mb-3">
                  Get the Flipcash app.
                </h3>
                <p className="text-[#a0a0a8] mb-6 max-w-xl">
                  Your gateway to programmable currencies. Send, receive, and manage all your digital currencies in one place. Available on iOS and Android.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {/* App Store */}
                  <a
                    href="https://apps.apple.com/app/flipcash/id6504628921"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#0c0c0f] hover:bg-[#1a1a1f] border border-[#2a2a30] rounded-lg px-4 py-2.5 transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] text-[#707078] leading-none">Download on the</div>
                      <div className="text-sm text-white font-medium leading-tight">App Store</div>
                    </div>
                  </a>
                  {/* Google Play */}
                  <a
                    href="https://play.google.com/store/apps/details?id=com.flipcash"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#0c0c0f] hover:bg-[#1a1a1f] border border-[#2a2a30] rounded-lg px-4 py-2.5 transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 01-.497-1.478V3.292c0-.547.19-1.051.497-1.478z"/>
                      <path fill="#34A853" d="M16.296 15.504L13.792 12l2.504-3.504 4.212 2.426c.728.418.728 1.44 0 1.86l-4.212 2.722z"/>
                      <path fill="#FBBC04" d="M3.609 22.186l7.427-7.427 2.504 3.504-9.434 5.401a1.867 1.867 0 01-.497-1.478z"/>
                      <path fill="#EA4335" d="M3.609 1.814c.127-.174.29-.326.497-.448l9.434 5.4-2.504 3.505-7.427-7.428-.001-.029z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-[10px] text-[#707078] leading-none">Get it on</div>
                      <div className="text-sm text-white font-medium leading-tight">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card: Explore Use Cases (Top Left) */}
            <Link
              href="/apps"
              className="bg-[#141418] border border-[#2a2a30] hover:border-[#D8C5FD]/50 rounded-2xl p-6 flex flex-col transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <img src="/flipcash.jpg" alt="Flipcash" className="w-5 h-5 rounded" />
                <span className="text-[#D8C5FD] font-medium text-sm">Ecosystem</span>
              </div>
              <h3 className="text-2xl font-bold text-moony-gradient mb-3">
                Explore use cases.
              </h3>
              <p className="text-[#a0a0a8] mb-4 flex-1">
                Discover how apps, games, and platforms are building real economies with programmable currencies.
              </p>
              {/* Stylized App Icons */}
              <div className="flex items-center mb-4">
                <div className="flex -space-x-3">
                  <img src="/apps/neon-racers.svg" alt="" className="w-10 h-10 rounded-xl border-2 border-[#141418] shadow-lg" />
                  <img src="/apps/pixel-kingdoms.svg" alt="" className="w-10 h-10 rounded-xl border-2 border-[#141418] shadow-lg" />
                  <img src="/apps/streampay.svg" alt="" className="w-10 h-10 rounded-xl border-2 border-[#141418] shadow-lg" />
                  <img src="/apps/art-vault.svg" alt="" className="w-10 h-10 rounded-xl border-2 border-[#141418] shadow-lg" />
                  <img src="/apps/chat-pay.svg" alt="" className="w-10 h-10 rounded-xl border-2 border-[#141418] shadow-lg" />
                </div>
                <span className="ml-3 text-[#707078] text-sm">+25 more</span>
              </div>
              <div className="inline-flex items-center gap-2 text-white font-medium w-fit">
                View apps
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Card: Fee Buybacks (Top Right) */}
            <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <img src="/moony.png" alt="Moony" className="w-5 h-5 rounded" />
                <span className="text-green-400 font-medium text-sm">Tokenomics</span>
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-3">
                Fees buy Moony.
              </h3>
              <p className="text-[#a0a0a8] mb-6 flex-1">
                Every buy on Moonyswap includes a 0.33% fee that automatically purchases MNY. More swaps, more demand for Moony.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-[#1a1a1f] rounded-full px-3 py-1.5 text-sm w-fit">
                  <img src="/moony.png" alt="Moony" className="w-4 h-4 rounded" />
                  <span className="text-green-400">0.33%</span>
                  <span className="text-[#707078]">buy fee → buys Moony</span>
                </div>
                <div className="flex items-center gap-2 bg-[#1a1a1f] rounded-full px-3 py-1.5 text-sm w-fit">
                  <img src="/flipcash.jpg" alt="Flipcash" className="w-4 h-4 rounded" />
                  <span className="text-[#a0a0a8]">1%</span>
                  <span className="text-[#707078]">sell fee → Flipcash</span>
                </div>
              </div>
            </div>

            {/* Card: Build with SDK - Coming Soon (Bottom Left) */}
            <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <img src="/flipcash.jpg" alt="Flipcash" className="w-5 h-5 rounded" />
                <span className="text-[#FFF2D9] font-medium text-sm">Developers</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#FFF2D9]/20 text-[#FFF2D9] px-1.5 py-0.5 rounded ml-auto">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#FFF2D9] mb-3">
                Build with Flipcash SDK.
              </h3>
              <p className="text-[#a0a0a8] mb-6 flex-1">
                Integrate programmable currencies into your app, game, or platform. Create real economies with guaranteed liquidity.
              </p>
              <div className="text-[#707078] text-sm">
                SDK documentation coming soon
              </div>
            </div>

            {/* Card: Learn About Moony (Bottom Right) */}
            <a
              href="https://moony.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-br from-[#D8C5FD]/10 to-[#FFF2D9]/10 border border-[#D8C5FD]/30 rounded-2xl p-6 flex flex-col hover:border-[#D8C5FD]/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <img src="/moony.png" alt="Moony" className="w-5 h-5 rounded" />
                <span className="text-[#D8C5FD] font-medium text-sm">Protocol</span>
              </div>
              <h3 className="text-2xl font-bold text-moony-gradient mb-3">
                Learn more about Moony.
              </h3>
              <p className="text-[#a0a0a8] mb-6 flex-1">
                An open monetary protocol for permissionless payments. Fixed-supply currency backed by verifiable onchain capital.
              </p>
              <div className="inline-flex items-center gap-2 text-[#D8C5FD] font-medium w-fit">
                Visit moony.org
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
