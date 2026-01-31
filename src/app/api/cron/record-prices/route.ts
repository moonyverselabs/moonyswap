import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { insertPriceRecords } from '@/lib/supabase';
import { discoverAllPools, DiscoveredPool } from '@/lib/discovery';
import { getSpotPrice, calculateCirculatingSupply } from '@/lib/curve';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set');
    return false;
  }

  // Vercel cron jobs send the secret as Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

// Fetch current prices from on-chain reserves
async function fetchCurrentPrices(): Promise<{ mint: string; price: number }[]> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
  }

  const connection = new Connection(rpcUrl);

  // Discover all pools
  const pools = await discoverAllPools(connection);

  if (pools.length === 0) {
    console.log('No pools discovered');
    return [];
  }

  // Fetch vault balances for all pools
  const vaultAddresses = pools.flatMap((p) => [p.currencyVault, p.baseVault]);
  const vaultInfos = await connection.getMultipleAccountsInfo(vaultAddresses);

  const prices: { mint: string; price: number }[] = [];

  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const tokenVaultInfo = vaultInfos[i * 2];

    if (!tokenVaultInfo) {
      console.error(`No vault info for pool ${pool.address.toString()}`);
      continue;
    }

    try {
      // Read token balance from vault (SPL token account layout)
      const tokenBalance = tokenVaultInfo.data.readBigUInt64LE(64);
      const circulatingSupply = calculateCirculatingSupply(tokenBalance);
      const currentPrice = getSpotPrice(circulatingSupply);

      prices.push({
        mint: pool.currencyMint.toString(),
        price: currentPrice.toNumber(),
      });
    } catch (err) {
      console.error(`Error processing pool ${pool.address.toString()}:`, err);
    }
  }

  return prices;
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or has valid secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Starting price recording cron job...');

    // Fetch current prices from on-chain
    const prices = await fetchCurrentPrices();

    if (prices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No prices to record',
        recordsInserted: 0,
      });
    }

    console.log(`Fetched ${prices.length} prices from on-chain`);

    // Insert into Supabase
    const result = await insertPriceRecords(prices);

    if (!result.success) {
      console.error('Failed to insert price records:', result.error);
      return NextResponse.json(
        { error: 'Failed to insert price records', details: result.error },
        { status: 500 }
      );
    }

    console.log(`Successfully recorded ${prices.length} price records`);

    return NextResponse.json({
      success: true,
      message: `Recorded ${prices.length} prices`,
      recordsInserted: prices.length,
      prices: prices.map((p) => ({
        mint: p.mint,
        price: p.price.toFixed(10),
      })),
    });
  } catch (error) {
    console.error('Error in price recording cron job:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
