'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';
import { getSpotPrice, calculateCirculatingSupply, quarksToTokens, usdfBaseToWhole, formatUsd } from '@/lib/curve';
import { KNOWN_TOKENS, TOKEN_DECIMALS, QUARKS_PER_TOKEN } from '@/lib/constants';
import BigNumber from 'bignumber.js';

export interface ReserveData {
  name: string;
  symbol: string;
  mint: PublicKey;
  pool: PublicKey;
  icon: string;
  circulatingSupply: number;
  totalSupply: number;
  currentPrice: BigNumber;
  currentPriceFormatted: string;
  reserveBalance: BigNumber;
  reserveBalanceFormatted: string;
  vaultTokenBalance: bigint;
  vaultUsdfBalance: bigint;
  loading: boolean;
  error: string | null;
  isMockData?: boolean;
}

// Layout offsets for LiquidityPool account (from flipcash-program)
// struct LiquidityPool {
//   authority: Pubkey,      // 0-32
//   currency: Pubkey,       // 32-64
//   mint_a: Pubkey,         // 64-96
//   mint_b: Pubkey,         // 96-128
//   vault_a: Pubkey,        // 128-160
//   vault_b: Pubkey,        // 160-192
//   fees_accumulated: u64,  // 192-200
//   sell_fee: u16,          // 200-202
//   bump: u8,               // 202
//   vault_a_bump: u8,       // 203
//   vault_b_bump: u8,       // 204
//   padding: [u8; 3]        // 205-208
// }

const DISCRIMINATOR_SIZE = 8;

export function useReserve(tokenKey: string = 'jeffy'): ReserveData {
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
    const token = KNOWN_TOKENS[tokenKey];
    if (!token) {
      setData(prev => ({ ...prev, loading: false, error: 'Unknown token' }));
      return;
    }

    try {
      // Fetch both vault balances in parallel
      const [tokenVaultInfo, usdfVaultInfo] = await Promise.all([
        connection.getAccountInfo(token.currencyVault),
        connection.getAccountInfo(token.baseVault),
      ]);

      if (!tokenVaultInfo || !usdfVaultInfo) {
        throw new Error('Could not fetch vault data');
      }

      // Parse token account data (SPL Token layout)
      // Token account: mint (32) + owner (32) + amount (8) + ...
      const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
      const usdfBalance = usdfVaultInfo.data.readBigUInt64LE(64);

      // Calculate circulating supply
      const circulatingSupply = calculateCirculatingSupply(tokenBalance);
      const currentPrice = getSpotPrice(circulatingSupply);
      const reserveBalance = usdfBaseToWhole(usdfBalance);

      setData({
        name: token.name,
        symbol: token.symbol,
        mint: token.mint,
        pool: token.pool,
        icon: token.icon,
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
      console.error('Error fetching reserve data, using mock data:', err);

      // Use mock data as fallback
      const mockCirculatingSupply = 1250; // ~1,250 tokens released
      const mockCurrentPrice = getSpotPrice(mockCirculatingSupply);
      const mockReserveBalance = new BigNumber(12.58); // ~$12.58 in reserve

      setData({
        name: token.name,
        symbol: token.symbol,
        mint: token.mint,
        pool: token.pool,
        icon: token.icon,
        circulatingSupply: mockCirculatingSupply,
        totalSupply: 21_000_000,
        currentPrice: mockCurrentPrice,
        currentPriceFormatted: formatUsd(mockCurrentPrice),
        reserveBalance: mockReserveBalance,
        reserveBalanceFormatted: formatUsd(mockReserveBalance),
        vaultTokenBalance: BigInt(0),
        vaultUsdfBalance: BigInt(0),
        loading: false,
        error: null,
        isMockData: true,
      });
    }
  }, [connection, tokenKey]);

  useEffect(() => {
    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return data;
}

export function useMultipleReserves(tokenKeys: string[] = Object.keys(KNOWN_TOKENS)) {
  const { connection } = useConnection();
  const [reserves, setReserves] = useState<Record<string, ReserveData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const results: Record<string, ReserveData> = {};

      for (const key of tokenKeys) {
        const token = KNOWN_TOKENS[key];
        if (!token) continue;

        try {
          const [tokenVaultInfo, usdfVaultInfo] = await Promise.all([
            connection.getAccountInfo(token.currencyVault),
            connection.getAccountInfo(token.baseVault),
          ]);

          if (tokenVaultInfo && usdfVaultInfo) {
            const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
            const usdfBalance = usdfVaultInfo.data.readBigUInt64LE(64);
            const circulatingSupply = calculateCirculatingSupply(tokenBalance);
            const currentPrice = getSpotPrice(circulatingSupply);
            const reserveBalance = usdfBaseToWhole(usdfBalance);

            results[key] = {
              name: token.name,
              symbol: token.symbol,
              mint: token.mint,
              pool: token.pool,
              icon: token.icon,
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
            };
          }
        } catch (err) {
          console.error(`Error fetching ${key}:`, err);
        }
      }

      setReserves(results);
      setLoading(false);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [connection, tokenKeys]);

  return { reserves, loading };
}
