'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { discoverAllPools, fetchTokenMetadata, DiscoveredPool, TokenMetadata } from '@/lib/discovery';
import { MOCK_MNY } from '@/lib/constants';
import { MOCK_TOKENS, EXTENDED_MOCK_TOKENS, MockToken } from '@/lib/mockTokens';
import { getSpotPrice, calculateCirculatingSupply, usdfBaseToWhole, formatUsd } from '@/lib/curve';
import BigNumber from 'bignumber.js';

export interface DiscoveredReserve {
  pool: DiscoveredPool;
  metadata: TokenMetadata;
  circulatingSupply: number;
  totalSupply: number;
  currentPrice: BigNumber;
  currentPriceFormatted: string;
  reserveBalance: BigNumber;
  reserveBalanceFormatted: string;
  marketCap: BigNumber;
  marketCapFormatted: string;
}

// Cache metadata to avoid repeated Helius API calls
const metadataCache: Record<string, TokenMetadata> = {};
let lastMetadataFetch = 0;
const METADATA_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Price refresh interval (vault balances)
const PRICE_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export function useDiscoverReserves() {
  const { connection } = useConnection();
  const [reserves, setReserves] = useState<DiscoveredReserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poolsRef = useRef<DiscoveredPool[]>([]);

  // Fetch metadata only if cache is stale
  const fetchMetadataIfNeeded = useCallback(async (mintAddresses: string[]) => {
    const now = Date.now();
    const uncachedMints = mintAddresses.filter(m => !metadataCache[m]);

    // Only fetch if we have uncached mints or cache is stale
    if (uncachedMints.length === 0 && now - lastMetadataFetch < METADATA_CACHE_TTL) {
      return;
    }

    const mintsToFetch = now - lastMetadataFetch >= METADATA_CACHE_TTL
      ? mintAddresses
      : uncachedMints;

    if (mintsToFetch.length === 0) return;

    try {
      const heliusApiKey = process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1] || '';
      const metadata = await fetchTokenMetadata(mintsToFetch, heliusApiKey);

      // Update cache
      Object.assign(metadataCache, metadata);
      lastMetadataFetch = now;
    } catch (err) {
      console.error('Error fetching metadata:', err);
      // Don't throw - we can still show data with cached/fallback metadata
    }
  }, []);

  // Full fetch: pools + metadata + prices
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Discover all pools
      const pools = await discoverAllPools(connection);
      poolsRef.current = pools;

      if (pools.length === 0) {
        setReserves([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch token metadata (cached)
      const mintAddresses = pools.map(p => p.currencyMint.toString());
      await fetchMetadataIfNeeded(mintAddresses);

      // Step 3: Fetch vault balances
      await updatePrices(pools);
    } catch (err) {
      console.error('Error discovering reserves:', err);
      setError(err instanceof Error ? err.message : 'Failed to discover reserves');
      setLoading(false);
    }
  }, [connection, fetchMetadataIfNeeded]);

  // Price-only update (no metadata fetch)
  const updatePrices = useCallback(async (pools?: DiscoveredPool[]) => {
    const poolsToUse = pools || poolsRef.current;
    if (poolsToUse.length === 0) return;

    try {
      const vaultAddresses = poolsToUse.flatMap(p => [p.currencyVault, p.baseVault]);
      const vaultInfos = await connection.getMultipleAccountsInfo(vaultAddresses);

      const results: DiscoveredReserve[] = [];

      for (let i = 0; i < poolsToUse.length; i++) {
        const pool = poolsToUse[i];
        const tokenVaultInfo = vaultInfos[i * 2];
        const usdfVaultInfo = vaultInfos[i * 2 + 1];

        if (!tokenVaultInfo || !usdfVaultInfo) continue;

        try {
          const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
          const usdfBalance = usdfVaultInfo.data.readBigUInt64LE(64);

          const circulatingSupply = calculateCirculatingSupply(tokenBalance);
          const currentPrice = getSpotPrice(circulatingSupply);
          const reserveBalance = usdfBaseToWhole(usdfBalance);
          const marketCap = currentPrice.multipliedBy(circulatingSupply);

          const mintKey = pool.currencyMint.toString();
          const tokenMetadata = metadataCache[mintKey] || {
            name: 'Unknown Token',
            symbol: mintKey.slice(0, 4),
            icon: '',
          };

          results.push({
            pool,
            metadata: tokenMetadata,
            circulatingSupply,
            totalSupply: 21_000_000,
            currentPrice,
            currentPriceFormatted: formatUsd(currentPrice),
            reserveBalance,
            reserveBalanceFormatted: formatUsd(reserveBalance),
            marketCap,
            marketCapFormatted: formatUsd(marketCap),
          });
        } catch (err) {
          console.error('Error processing pool:', pool.address.toString(), err);
        }
      }

      // Add mock tokens if enabled
      if (MOCK_MNY.enabled) {
        const jfyReserve = results.find(r => r.pool.currencyMint.toString() === MOCK_MNY.realMint);
        if (jfyReserve) {
          // Add mock MNY
          results.push({
            ...jfyReserve,
            pool: {
              ...jfyReserve.pool,
              currencyMint: { toString: () => MOCK_MNY.mockMint } as any,
            },
            metadata: {
              name: MOCK_MNY.name,
              symbol: MOCK_MNY.symbol,
              icon: MOCK_MNY.icon,
            },
          });

          // Add additional mock tokens
          const allMockTokens = [...MOCK_TOKENS, ...EXTENDED_MOCK_TOKENS];
          for (const mockToken of allMockTokens) {
            results.push({
              ...jfyReserve,
              pool: {
                ...jfyReserve.pool,
                currencyMint: { toString: () => mockToken.mint } as any,
              },
              metadata: {
                name: mockToken.name,
                symbol: mockToken.symbol,
                icon: mockToken.icon,
              },
            });
          }
        }
      }

      // Sort: MNY first, JFY second, then by reserve balance
      results.sort((a, b) => {
        const aMint = a.pool.currencyMint.toString();
        const bMint = b.pool.currencyMint.toString();
        if (a.metadata.symbol === 'MNY') return -1;
        if (b.metadata.symbol === 'MNY') return 1;
        if (aMint === MOCK_MNY.realMint) return -1;
        if (bMint === MOCK_MNY.realMint) return 1;
        return b.reserveBalance.minus(a.reserveBalance).toNumber();
      });

      setReserves(results);
    } catch (err) {
      console.error('Error updating prices:', err);
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    // Initial full fetch
    fetchAll();

    // Price updates every 30 seconds (no metadata fetch)
    const priceInterval = setInterval(() => updatePrices(), PRICE_REFRESH_INTERVAL);

    return () => clearInterval(priceInterval);
  }, [fetchAll, updatePrices]);

  return { reserves, loading, error, refresh: fetchAll };
}
