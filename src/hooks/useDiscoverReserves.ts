'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { discoverAllPools, fetchTokenMetadata, DiscoveredPool, TokenMetadata } from '@/lib/discovery';
import { MOCK_MNY } from '@/lib/constants';
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

export function useDiscoverReserves() {
  const { connection } = useConnection();
  const [reserves, setReserves] = useState<DiscoveredReserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReserves = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Discover all pools
      const pools = await discoverAllPools(connection);

      if (pools.length === 0) {
        setReserves([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch token metadata for all discovered mints
      const mintAddresses = pools.map(p => p.currencyMint.toString());
      const heliusApiKey = process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1] || '';
      const metadata = await fetchTokenMetadata(mintAddresses, heliusApiKey);

      // Step 3: Fetch vault balances for all pools
      const vaultAddresses = pools.flatMap(p => [p.currencyVault, p.baseVault]);
      const vaultInfos = await connection.getMultipleAccountsInfo(vaultAddresses);

      // Step 4: Process each pool
      const results: DiscoveredReserve[] = [];

      for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        const tokenVaultInfo = vaultInfos[i * 2];
        const usdfVaultInfo = vaultInfos[i * 2 + 1];

        if (!tokenVaultInfo || !usdfVaultInfo) continue;

        try {
          // Parse token account balances
          const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
          const usdfBalance = usdfVaultInfo.data.readBigUInt64LE(64);

          const circulatingSupply = calculateCirculatingSupply(tokenBalance);
          const currentPrice = getSpotPrice(circulatingSupply);
          const reserveBalance = usdfBaseToWhole(usdfBalance);
          const marketCap = currentPrice.multipliedBy(circulatingSupply);

          const mintKey = pool.currencyMint.toString();
          const tokenMetadata = metadata[mintKey] || {
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

      // Add mock MNY if enabled (duplicates JFY data with MNY branding)
      if (MOCK_MNY.enabled) {
        const jfyReserve = results.find(r => r.pool.currencyMint.toString() === MOCK_MNY.realMint);
        if (jfyReserve) {
          const mockMnyReserve: DiscoveredReserve = {
            ...jfyReserve,
            pool: {
              ...jfyReserve.pool,
              // Use a fake address for routing purposes
              currencyMint: { toString: () => MOCK_MNY.mockMint } as any,
            },
            metadata: {
              name: MOCK_MNY.name,
              symbol: MOCK_MNY.symbol,
              icon: MOCK_MNY.icon,
            },
          };
          results.push(mockMnyReserve);
        }
      }

      // Sort by reserve balance (descending), but always put Moony first
      results.sort((a, b) => {
        // Moony always first
        if (a.metadata.symbol === 'MNY') return -1;
        if (b.metadata.symbol === 'MNY') return 1;
        // Then sort by reserve balance
        return b.reserveBalance.minus(a.reserveBalance).toNumber();
      });

      setReserves(results);
    } catch (err) {
      console.error('Error discovering reserves:', err);
      setError(err instanceof Error ? err.message : 'Failed to discover reserves');
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    fetchReserves();

    // Refresh every 60 seconds
    const interval = setInterval(fetchReserves, 60000);
    return () => clearInterval(interval);
  }, [fetchReserves]);

  return { reserves, loading, error, refresh: fetchReserves };
}
