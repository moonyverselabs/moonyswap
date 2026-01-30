'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';
import { discoverAllPools, fetchTokenMetadata } from '@/lib/discovery';
import { MOCK_MNY } from '@/lib/constants';
import { getSpotPrice, calculateCirculatingSupply, usdfBaseToWhole, formatUsd } from '@/lib/curve';
import { ReserveData } from './useReserve';
import BigNumber from 'bignumber.js';

/**
 * Load a reserve by mint address (on-chain discovery)
 */
export function useReserveByMint(mintAddress: string): ReserveData {
  const { connection } = useConnection();
  const [data, setData] = useState<ReserveData>({
    name: '',
    symbol: '',
    mint: PublicKey.default,
    pool: PublicKey.default,
    icon: '',
    circulatingSupply: 0,
    totalSupply: 21_000_000,
    currentPrice: new BigNumber(0),
    currentPriceFormatted: '$0.00',
    reserveBalance: new BigNumber(0),
    reserveBalanceFormatted: '$0.00',
    vaultTokenBalance: BigInt(0),
    vaultUsdfBalance: BigInt(0),
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!mintAddress) {
      setData(prev => ({ ...prev, loading: false, error: 'No mint address provided' }));
      return;
    }

    try {
      // Check if this is the mock MNY token
      const isMockMny = MOCK_MNY.enabled && mintAddress === MOCK_MNY.mockMint;
      const lookupMint = isMockMny ? MOCK_MNY.realMint : mintAddress;

      // Step 1: Discover all pools and find the one matching this mint
      const pools = await discoverAllPools(connection);
      const pool = pools.find(p => p.currencyMint.toString() === lookupMint);

      if (!pool) {
        setData(prev => ({ ...prev, loading: false, error: 'Reserve not found for this token' }));
        return;
      }

      // Step 2: Fetch token metadata (or use mock metadata)
      let tokenMetadata;
      if (isMockMny) {
        tokenMetadata = {
          name: MOCK_MNY.name,
          symbol: MOCK_MNY.symbol,
          icon: MOCK_MNY.icon,
        };
      } else {
        const heliusApiKey = process.env.NEXT_PUBLIC_RPC_URL?.match(/api-key=([^&]+)/)?.[1] || '';
        const metadata = await fetchTokenMetadata([mintAddress], heliusApiKey);
        tokenMetadata = metadata[mintAddress] || {
          name: 'Unknown Token',
          symbol: mintAddress.slice(0, 4),
          icon: '',
        };
      }

      // Step 3: Fetch vault balances
      const [tokenVaultInfo, usdfVaultInfo] = await Promise.all([
        connection.getAccountInfo(pool.currencyVault),
        connection.getAccountInfo(pool.baseVault),
      ]);

      if (!tokenVaultInfo || !usdfVaultInfo) {
        throw new Error('Could not fetch vault data');
      }

      // Parse token account balances
      const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
      const usdfBalance = usdfVaultInfo.data.readBigUInt64LE(64);

      const circulatingSupply = calculateCirculatingSupply(tokenBalance);
      const currentPrice = getSpotPrice(circulatingSupply);
      const reserveBalance = usdfBaseToWhole(usdfBalance);

      setData({
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        mint: pool.currencyMint,
        pool: pool.address,
        icon: tokenMetadata.icon,
        circulatingSupply,
        totalSupply: 21_000_000,
        currentPrice,
        currentPriceFormatted: formatUsd(currentPrice),
        reserveBalance,
        reserveBalanceFormatted: formatUsd(reserveBalance),
        vaultTokenBalance: tokenBalance,
        vaultUsdfBalance: usdfBalance,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching reserve by mint:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load reserve',
      }));
    }
  }, [connection, mintAddress]);

  useEffect(() => {
    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return data;
}
