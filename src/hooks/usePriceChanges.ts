'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PriceChange {
  mint: string;
  currentPrice: number;
  price24hAgo: number | null;
  change24h: number | null; // Percentage change
  changeAbsolute: number | null; // Absolute change in USD
}

interface UsePriceChangesResult {
  priceChanges: Record<string, PriceChange>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Refresh interval (30 seconds)
const REFRESH_INTERVAL = 30 * 1000;

export function usePriceChanges(): UsePriceChangesResult {
  const [priceChanges, setPriceChanges] = useState<Record<string, PriceChange>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceChanges = useCallback(async () => {
    try {
      const response = await fetch('/api/price-changes');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch price changes');
      }

      // Convert array to record keyed by mint
      const changesRecord: Record<string, PriceChange> = {};
      for (const change of data.priceChanges) {
        changesRecord[change.mint] = change;
      }

      setPriceChanges(changesRecord);
      setError(null);
    } catch (err) {
      console.error('Error fetching price changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price changes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPriceChanges();

    // Set up refresh interval
    const interval = setInterval(fetchPriceChanges, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchPriceChanges]);

  return {
    priceChanges,
    loading,
    error,
    refresh: fetchPriceChanges,
  };
}

// Helper function to format price change for display
export function formatPriceChange(change: number | null): string {
  if (change === null) return '--';

  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// Helper function to get CSS class for price change
export function getPriceChangeClass(change: number | null): string {
  if (change === null) return 'text-gray-500';
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}

// Helper hook to get price change for a specific mint
export function usePriceChangeForMint(mint: string): {
  priceChange: PriceChange | null;
  loading: boolean;
  error: string | null;
} {
  const { priceChanges, loading, error } = usePriceChanges();

  return {
    priceChange: priceChanges[mint] || null,
    loading,
    error,
  };
}
