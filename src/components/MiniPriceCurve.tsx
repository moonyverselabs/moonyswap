'use client';

import { useMemo } from 'react';
import { getSpotPrice, getTokenCost } from '@/lib/curve';
import BigNumber from 'bignumber.js';

interface MiniPriceCurveProps {
  currentReserve: BigNumber;
  className?: string;
}

export function MiniPriceCurve({ currentReserve, className = '' }: MiniPriceCurveProps) {
  // Generate curve data up to ~10x current reserve or $1K minimum
  const targetReserve = Math.max(currentReserve.toNumber() * 10, 1000);

  const { pathD, currentX, currentY, width, height } = useMemo(() => {
    const w = 300;
    const h = 80;
    const padY = 6;

    // Find supply at target reserve using binary search
    const supplyAtReserve = (target: number): number => {
      let low = 0, high = 21_000_000;
      for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const res = getTokenCost(0, mid).toNumber();
        if (res < target) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };

    const maxSupply = supplyAtReserve(targetReserve);
    const currentSupply = supplyAtReserve(currentReserve.toNumber());

    // Generate points
    const points: { x: number; y: number; reserve: number }[] = [];
    const samples = 50;

    let minPrice = Infinity, maxPrice = 0;
    const rawPoints: { supply: number; price: number; reserve: number }[] = [];

    for (let i = 0; i <= samples; i++) {
      const supply = (i / samples) * maxSupply;
      const price = getSpotPrice(supply).toNumber();
      const reserve = getTokenCost(0, supply).toNumber();
      rawPoints.push({ supply, price, reserve });
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }

    // Scale to SVG coordinates - fill the width, leave small padding on top/bottom
    const priceRange = maxPrice - minPrice || 1;
    for (const p of rawPoints) {
      points.push({
        x: (p.reserve / targetReserve) * w,
        y: padY + (1 - (p.price - minPrice) / priceRange) * (h - padY * 2),
        reserve: p.reserve,
      });
    }

    // Generate path
    const path = points.reduce((d, p, i) =>
      d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), ''
    );

    // Current position
    const currRes = currentReserve.toNumber();
    const currPrice = getSpotPrice(currentSupply).toNumber();
    const cx = (currRes / targetReserve) * w;
    const cy = padY + (1 - (currPrice - minPrice) / priceRange) * (h - padY * 2);

    return { pathD: path, currentX: cx, currentY: cy, width: w, height: h };
  }, [currentReserve, targetReserve]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="xMidYMid slice">
      {/* Gradient fill under curve */}
      <defs>
        <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area under curve */}
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#miniGradient)"
      />

      {/* Curve line */}
      <path
        d={pathD}
        fill="none"
        stroke="#a855f7"
        strokeWidth="2.5"
      />

      {/* Current position */}
      <circle
        cx={currentX}
        cy={currentY}
        r="5"
        fill="#a855f7"
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}
