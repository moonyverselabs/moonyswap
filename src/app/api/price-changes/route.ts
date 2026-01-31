import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { get24hAgoPrices, calculatePriceChanges, PriceChange } from '@/lib/supabase';
import { discoverAllPools } from '@/lib/discovery';
import { getSpotPrice, calculateCirculatingSupply } from '@/lib/curve';

// Cache for price changes (refreshed every 30 seconds)
let cachedPriceChanges: PriceChange[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

// Fetch current prices from on-chain
async function fetchCurrentPrices(): Promise<Record<string, number>> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
  }

  const connection = new Connection(rpcUrl);

  // Discover all pools
  const pools = await discoverAllPools(connection);

  if (pools.length === 0) {
    return {};
  }

  // Fetch vault balances for all pools
  const vaultAddresses = pools.flatMap((p) => [p.currencyVault, p.baseVault]);
  const vaultInfos = await connection.getMultipleAccountsInfo(vaultAddresses);

  const prices: Record<string, number> = {};

  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const tokenVaultInfo = vaultInfos[i * 2];

    if (!tokenVaultInfo) continue;

    try {
      const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
      const circulatingSupply = calculateCirculatingSupply(tokenBalance);
      const currentPrice = getSpotPrice(circulatingSupply);

      prices[pool.currencyMint.toString()] = currentPrice.toNumber();
    } catch (err) {
      console.error(`Error processing pool ${pool.address.toString()}:`, err);
    }
  }

  return prices;
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // Check if we have valid cached data
    if (cachedPriceChanges && now - lastCacheUpdate < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        priceChanges: cachedPriceChanges,
        cached: true,
        cacheAge: Math.round((now - lastCacheUpdate) / 1000),
      });
    }

    // Fetch current prices and 24h ago prices in parallel
    const [currentPrices, prices24hAgo] = await Promise.all([
      fetchCurrentPrices(),
      get24hAgoPrices(),
    ]);

    // Calculate price changes
    const priceChanges = calculatePriceChanges(currentPrices, prices24hAgo);

    // Update cache
    cachedPriceChanges = priceChanges;
    lastCacheUpdate = now;

    return NextResponse.json({
      success: true,
      priceChanges,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching price changes:', error);

    // Return cached data if available, even if stale
    if (cachedPriceChanges) {
      return NextResponse.json({
        success: true,
        priceChanges: cachedPriceChanges,
        cached: true,
        stale: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch price changes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
