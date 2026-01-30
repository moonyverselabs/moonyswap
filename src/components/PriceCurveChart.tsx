'use client';

import { useMemo, useState } from 'react';
import { getSpotPrice, getTokenCost } from '@/lib/curve';
import BigNumber from 'bignumber.js';

interface PriceCurveChartProps {
  circulatingSupply: number;
  totalSupply: number;
  currentPrice: BigNumber;
  currentReserve: BigNumber;
  symbol: string;
}

type ZoomLevel = 'current' | 'r1k' | 'r10k' | 'r100k' | 'r1m' | 'r10m' | 'r100m' | 'r1b';

// Helper: find supply level that corresponds to a given reserve amount
// Using binary search since the inverse is complex
function supplyAtReserve(targetReserve: number, maxSupply: number): number {
  if (targetReserve <= 0) return 0;

  let low = 0;
  let high = maxSupply;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const reserve = getTokenCost(0, mid).toNumber();

    if (Math.abs(reserve - targetReserve) < 0.01) return mid;
    if (reserve < targetReserve) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

const ZOOM_OPTIONS: { key: ZoomLevel; label: string; reserveTarget: number | null }[] = [
  { key: 'current', label: 'Current', reserveTarget: null },
  { key: 'r1k', label: '$1K', reserveTarget: 1_000 },
  { key: 'r10k', label: '$10K', reserveTarget: 10_000 },
  { key: 'r100k', label: '$100K', reserveTarget: 100_000 },
  { key: 'r1m', label: '$1M', reserveTarget: 1_000_000 },
  { key: 'r10m', label: '$10M', reserveTarget: 10_000_000 },
  { key: 'r100m', label: '$100M', reserveTarget: 100_000_000 },
  { key: 'r1b', label: '$1B', reserveTarget: 1_000_000_000 },
];

export function PriceCurveChart({
  circulatingSupply,
  totalSupply,
  currentPrice,
  currentReserve,
  symbol,
}: PriceCurveChartProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('current');
  const [hoverData, setHoverData] = useState<{ x: number; y: number; reserve: number; price: number; gain: number } | null>(null);

  // Calculate supply range based on reserve-based zoom
  const { supplyMin, supplyMax } = useMemo(() => {
    const zoomOption = ZOOM_OPTIONS.find(z => z.key === zoom) || ZOOM_OPTIONS[0];

    if (zoom === 'current') {
      // Show 10x the current reserve or at least $1000 worth
      const targetReserve = Math.max(currentReserve.toNumber() * 10, 1000);
      return { supplyMin: 0, supplyMax: supplyAtReserve(targetReserve, totalSupply) };
    }

    // Reserve-based zoom
    const targetReserve = zoomOption.reserveTarget || 1000;
    return { supplyMin: 0, supplyMax: supplyAtReserve(targetReserve, totalSupply) };
  }, [zoom, currentReserve, totalSupply]);

  // Generate curve data points for current zoom range
  const curveData = useMemo(() => {
    const points: { supply: number; reserve: number; price: number; logPrice: number }[] = [];

    const samples = 200;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const supply = supplyMin + t * (supplyMax - supplyMin);

      try {
        const price = getSpotPrice(supply);
        const priceNum = price.toNumber();
        const reserve = getTokenCost(0, supply).toNumber();
        if (isFinite(priceNum) && priceNum > 0 && isFinite(reserve)) {
          points.push({
            supply,
            reserve,
            price: priceNum,
            logPrice: Math.log10(priceNum),
          });
        }
      } catch {
        // Skip invalid points
      }
    }

    return points;
  }, [supplyMin, supplyMax]);

  // Get reserve range for X-axis
  const reserveRange = useMemo(() => {
    if (curveData.length === 0) return { min: 0, max: 100 };
    return {
      min: curveData[0].reserve,
      max: curveData[curveData.length - 1].reserve,
    };
  }, [curveData]);

  // Chart dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Use linear scale for zoomed views, log scale for wide views
  const useLogScale = zoom === 'r1m' || zoom === 'r10m' || zoom === 'r100m' || zoom === 'r1b';

  // Calculate dynamic Y scale based on data in view
  const priceRange = useMemo(() => {
    if (curveData.length === 0) return { min: 0.01, max: 1, minLog: -2, maxLog: 0 };

    const prices = curveData.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (useLogScale) {
      const minLog = Math.floor(Math.log10(minPrice));
      const maxLog = Math.ceil(Math.log10(maxPrice));
      return { min: minPrice, max: maxPrice, minLog: minLog - 0.5, maxLog: maxLog + 0.5 };
    } else {
      // Linear scale - add 20% padding
      const padding = (maxPrice - minPrice) * 0.2 || minPrice * 0.5;
      return {
        min: Math.max(0, minPrice - padding),
        max: maxPrice + padding,
        minLog: Math.log10(minPrice),
        maxLog: Math.log10(maxPrice),
      };
    }
  }, [curveData, useLogScale]);

  const xScale = (reserve: number) =>
    padding.left + ((reserve - reserveRange.min) / (reserveRange.max - reserveRange.min)) * chartWidth;

  const yScale = (price: number) => {
    if (useLogScale) {
      const logPrice = Math.log10(price);
      return padding.top + chartHeight - ((logPrice - priceRange.minLog) / (priceRange.maxLog - priceRange.minLog)) * chartHeight;
    } else {
      return padding.top + chartHeight - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * chartHeight;
    }
  };

  // Handle mouse move over chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const svgY = ((e.clientY - rect.top) / rect.height) * height;

    // Check if within chart area
    if (svgX < padding.left || svgX > width - padding.right ||
        svgY < padding.top || svgY > padding.top + chartHeight) {
      setHoverData(null);
      return;
    }

    // Find corresponding reserve value
    const chartX = svgX - padding.left;
    const pct = chartX / chartWidth;
    const reserve = reserveRange.min + pct * (reserveRange.max - reserveRange.min);

    // Find closest data point
    const closest = curveData.reduce((prev, curr) =>
      Math.abs(curr.reserve - reserve) < Math.abs(prev.reserve - reserve) ? curr : prev
    );

    // Calculate gain from current price
    const currentPriceNum = currentPrice.toNumber();
    const gain = ((closest.price - currentPriceNum) / currentPriceNum) * 100;

    setHoverData({
      x: xScale(closest.reserve),
      y: yScale(closest.price),
      reserve: closest.reserve,
      price: closest.price,
      gain,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Generate path
  const pathD = useMemo(() => {
    if (curveData.length === 0) return '';

    return curveData.reduce((path, point, i) => {
      const x = xScale(point.reserve);
      const y = yScale(point.price);
      return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  }, [curveData, useLogScale, priceRange, reserveRange]);

  // Current position
  const currentX = xScale(currentReserve.toNumber());
  const currentY = yScale(currentPrice.toNumber());

  // Area under curve up to current reserve
  const areaPath = useMemo(() => {
    const currentRes = currentReserve.toNumber();
    if (currentRes < reserveRange.min || currentRes > reserveRange.max) return '';

    const pointsUpToCurrent = curveData.filter(p => p.reserve <= currentRes);
    if (pointsUpToCurrent.length === 0) return '';

    let path = pointsUpToCurrent.reduce((p, point, i) => {
      const x = xScale(point.reserve);
      const y = yScale(point.price);
      return p + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');

    // Close the area - go to bottom of chart
    const lastX = xScale(currentRes);
    const baseY = padding.top + chartHeight;
    path += ` L ${lastX} ${baseY} L ${padding.left} ${baseY} Z`;

    return path;
  }, [curveData, currentReserve, reserveRange, useLogScale, priceRange]);

  // Y-axis ticks - dynamic based on visible range and scale type
  const yTicks = useMemo(() => {
    const ticks: { price: number; label: string; y: number }[] = [];

    if (useLogScale) {
      // Log scale ticks
      const minTick = Math.ceil(priceRange.minLog);
      const maxTick = Math.floor(priceRange.maxLog);

      for (let log = minTick; log <= maxTick; log++) {
        const price = Math.pow(10, log);
        let label: string;
        if (log < 0) {
          label = `$${price.toFixed(Math.abs(log))}`;
        } else if (log >= 6) {
          label = `$${(price / 1_000_000).toFixed(0)}M`;
        } else if (log >= 3) {
          label = `$${(price / 1_000).toFixed(0)}K`;
        } else {
          label = `$${price.toFixed(0)}`;
        }
        ticks.push({ price, label, y: yScale(price) });
      }
    } else {
      // Linear scale ticks
      const range = priceRange.max - priceRange.min;
      const tickCount = 5;

      for (let i = 0; i <= tickCount; i++) {
        const price = priceRange.min + (i / tickCount) * range;
        let label: string;
        if (price < 0.001) {
          label = `$${price.toFixed(6)}`;
        } else if (price < 0.01) {
          label = `$${price.toFixed(5)}`;
        } else if (price < 1) {
          label = `$${price.toFixed(4)}`;
        } else if (price < 1000) {
          label = `$${price.toFixed(2)}`;
        } else {
          label = `$${(price / 1000).toFixed(1)}K`;
        }
        ticks.push({ price, label, y: yScale(price) });
      }
    }
    return ticks;
  }, [priceRange, useLogScale]);

  // X-axis ticks - dynamic based on reserve range
  const xTicks = useMemo(() => {
    const range = reserveRange.max - reserveRange.min;
    const tickCount = 5;
    const ticks: { reserve: number; label: string; x: number }[] = [];

    for (let i = 0; i <= tickCount; i++) {
      const reserve = reserveRange.min + (i / tickCount) * range;
      let label: string;
      if (reserve >= 1_000_000) {
        label = `$${(reserve / 1_000_000).toFixed(1)}M`;
      } else if (reserve >= 1_000) {
        label = `$${(reserve / 1_000).toFixed(1)}K`;
      } else if (reserve >= 1) {
        label = `$${reserve.toFixed(0)}`;
      } else {
        label = `$${reserve.toFixed(2)}`;
      }
      ticks.push({ reserve, label, x: xScale(reserve) });
    }
    return ticks;
  }, [reserveRange]);

  const supplyPercent = ((circulatingSupply / totalSupply) * 100).toFixed(4);

  // Check if current position is visible in this zoom
  const currentRes = currentReserve.toNumber();
  const isCurrentVisible = currentRes >= reserveRange.min && currentRes <= reserveRange.max;

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-white font-semibold">Price Curve</h3>
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
          {ZOOM_OPTIONS.map(option => (
            <button
              key={option.key}
              onClick={() => setZoom(option.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                zoom === option.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={tick.y}
            x2={width - padding.right}
            y2={tick.y}
            stroke="#374151"
            strokeWidth="1"
          />
        ))}

        {/* Filled area under curve */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          opacity="0.3"
        />

        {/* Curve line */}
        <path
          d={pathD}
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
        />

        {/* Current position marker (only if visible) */}
        {isCurrentVisible && (
          <>
            <circle
              cx={currentX}
              cy={currentY}
              r="8"
              fill="#a855f7"
              stroke="#fff"
              strokeWidth="2"
            />
            <line
              x1={currentX}
              y1={currentY}
              x2={currentX}
              y2={padding.top + chartHeight}
              stroke="#a855f7"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          </>
        )}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={tick.y}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#9ca3af"
            fontSize="11"
          >
            {tick.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="11"
          >
            {tick.label}
          </text>
        ))}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="12"
        >
          Reserve Balance (USDF)
        </text>

        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="12"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          Price (USD)
        </text>

        {/* Current price label (only if visible) */}
        {isCurrentVisible && !hoverData && (
          <text
            x={currentX + 12}
            y={currentY - 12}
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
          >
            {currentPrice.isLessThan(1)
              ? `$${currentPrice.toFixed(4)}`
              : `$${currentPrice.toFixed(2)}`
            }
          </text>
        )}

        {/* Hover indicator */}
        {hoverData && (
          <>
            {/* Vertical line */}
            <line
              x1={hoverData.x}
              y1={padding.top}
              x2={hoverData.x}
              y2={padding.top + chartHeight}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Horizontal line */}
            <line
              x1={padding.left}
              y1={hoverData.y}
              x2={width - padding.right}
              y2={hoverData.y}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Dot */}
            <circle
              cx={hoverData.x}
              cy={hoverData.y}
              r="6"
              fill="#10b981"
              stroke="#fff"
              strokeWidth="2"
            />
            {/* Tooltip background */}
            <rect
              x={hoverData.x + 10}
              y={hoverData.y - 45}
              width="110"
              height="40"
              rx="4"
              fill="#1f2937"
              stroke="#374151"
            />
            {/* Tooltip text - Price */}
            <text
              x={hoverData.x + 18}
              y={hoverData.y - 28}
              fill="#fff"
              fontSize="12"
              fontWeight="bold"
            >
              {hoverData.price < 1
                ? `$${hoverData.price.toFixed(4)}`
                : `$${hoverData.price.toFixed(2)}`
              }
            </text>
            {/* Tooltip text - Gain */}
            <text
              x={hoverData.x + 18}
              y={hoverData.y - 12}
              fill={hoverData.gain >= 0 ? "#10b981" : "#ef4444"}
              fontSize="11"
            >
              {hoverData.gain >= 0 ? '+' : ''}{hoverData.gain.toFixed(2)}% from current
            </text>
          </>
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend / Info */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Current: {currentReserve.isLessThan(1000) ? `$${currentReserve.toFixed(2)}` : `$${(currentReserve.toNumber() / 1000).toFixed(1)}K`} in reserve</span>
          </div>
        </div>
        <div className="text-slate-500">
          Hover over curve to see price at any point
        </div>
      </div>
    </div>
  );
}
