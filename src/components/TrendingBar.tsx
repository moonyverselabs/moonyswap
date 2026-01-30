'use client';

import Link from 'next/link';
import { useDiscoverReserves } from '@/hooks/useDiscoverReserves';
import { getSpotPrice, getTokenCost } from '@/lib/curve';

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

interface TrendingBarProps {
  currentMint?: string;
}

export function TrendingBar({ currentMint }: TrendingBarProps) {
  const { reserves, loading } = useDiscoverReserves();

  if (loading || reserves.length === 0) {
    return null;
  }

  // Generate top 10 by looping if needed - rank is based on unique position
  const top10: { reserve: typeof reserves[0]; rank: number }[] = [];
  const maxItems = 10;
  for (let i = 0; i < maxItems; i++) {
    const originalIndex = i % reserves.length;
    top10.push({
      reserve: reserves[originalIndex],
      rank: originalIndex + 1, // Rank based on unique position, not loop position
    });
  }
  // Duplicate for seamless loop
  const items = [...top10, ...top10];

  return (
    <section className="border-b border-slate-800 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center">
        <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-3 border-r border-slate-800 z-10">
          <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Top 10</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee hover:pause-marquee">
            {items.map((item, idx) => {
              const mint = item.reserve.pool.currencyMint.toString();
              const isCurrent = mint === currentMint;
              const milestone = getNextMilestone(
                item.reserve.reserveBalance.toNumber(),
                item.reserve.currentPrice.toNumber()
              );

              return (
                <Link
                  key={`${mint}-${idx}`}
                  href={`/token/${mint}`}
                  className={`flex items-center gap-2 px-4 py-3 transition-colors flex-shrink-0 border-r border-slate-800/50 ${
                    isCurrent
                      ? 'bg-emerald-500/10'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`text-xs font-medium w-5 ${isCurrent ? 'text-emerald-400' : 'text-slate-500'}`}>
                    #{item.rank}
                  </span>
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
                  <span className={`text-sm font-medium ${isCurrent ? 'text-emerald-300' : 'text-white'}`}>
                    {item.reserve.metadata.symbol}
                  </span>
                  <span className="text-slate-400 text-sm">{item.reserve.currentPriceFormatted}</span>
                  {milestone && (
                    <span className="text-green-400 text-xs font-medium">+{milestone.gain.toFixed(0)}%</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
