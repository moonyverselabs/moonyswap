import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Price History Schema
 *
 * Run this SQL in your Supabase SQL Editor to create the required table:
 *
 * ```sql
 * -- Create the price_history table
 * CREATE TABLE price_history (
 *   id BIGSERIAL PRIMARY KEY,
 *   mint TEXT NOT NULL,
 *   price DECIMAL(20, 10) NOT NULL,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * -- Create indexes for efficient queries
 * CREATE INDEX idx_price_history_mint ON price_history(mint);
 * CREATE INDEX idx_price_history_timestamp ON price_history(timestamp DESC);
 * CREATE INDEX idx_price_history_mint_timestamp ON price_history(mint, timestamp DESC);
 *
 * -- Optional: Enable Row Level Security (RLS)
 * ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
 *
 * -- Allow public read access (prices are public data)
 * CREATE POLICY "Allow public read access" ON price_history
 *   FOR SELECT USING (true);
 *
 * -- Only allow service role to insert (for cron job)
 * CREATE POLICY "Allow service role insert" ON price_history
 *   FOR INSERT WITH CHECK (true);
 *
 * -- Optional: Create a function to clean up old data (keep 30 days)
 * CREATE OR REPLACE FUNCTION cleanup_old_price_history()
 * RETURNS void AS $$
 * BEGIN
 *   DELETE FROM price_history WHERE timestamp < NOW() - INTERVAL '30 days';
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Optional: Schedule cleanup (requires pg_cron extension)
 * -- SELECT cron.schedule('cleanup-price-history', '0 0 * * *', 'SELECT cleanup_old_price_history()');
 * ```
 */

// Type definitions for the price_history table
export interface PriceHistoryRecord {
  id?: number;
  mint: string;
  price: number;
  timestamp: string;
  created_at?: string;
}

// Public client for client-side reads
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service client for server-side operations (cron jobs, writes)
export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Helper to insert price records
export async function insertPriceRecords(
  records: { mint: string; price: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabaseService = getServiceSupabase();

  const recordsWithTimestamp = records.map((r) => ({
    ...r,
    timestamp: new Date().toISOString(),
  }));

  const { error } = await supabaseService
    .from('price_history')
    .insert(recordsWithTimestamp);

  if (error) {
    console.error('Error inserting price records:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Helper to get prices from 24 hours ago for all mints
export async function get24hAgoPrices(): Promise<Record<string, number>> {
  const supabaseService = getServiceSupabase();

  // Get the timestamp from ~24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get the closest price record to 24h ago for each mint
  // We'll get records from 23-25 hours ago and pick the closest
  const windowStart = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const windowEnd = new Date(Date.now() - 23 * 60 * 60 * 1000);

  const { data, error } = await supabaseService
    .from('price_history')
    .select('mint, price, timestamp')
    .gte('timestamp', windowStart.toISOString())
    .lte('timestamp', windowEnd.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching 24h ago prices:', error);
    return {};
  }

  // Group by mint and get the record closest to 24h ago
  const pricesByMint: Record<string, number> = {};
  const seenMints = new Set<string>();

  for (const record of data || []) {
    if (!seenMints.has(record.mint)) {
      pricesByMint[record.mint] = record.price;
      seenMints.add(record.mint);
    }
  }

  return pricesByMint;
}

// Helper to calculate price changes
export interface PriceChange {
  mint: string;
  currentPrice: number;
  price24hAgo: number | null;
  change24h: number | null; // Percentage change
  changeAbsolute: number | null; // Absolute change in USD
}

export function calculatePriceChanges(
  currentPrices: Record<string, number>,
  prices24hAgo: Record<string, number>
): PriceChange[] {
  const changes: PriceChange[] = [];

  for (const [mint, currentPrice] of Object.entries(currentPrices)) {
    const price24hAgo = prices24hAgo[mint] ?? null;

    let change24h: number | null = null;
    let changeAbsolute: number | null = null;

    if (price24hAgo !== null && price24hAgo > 0) {
      changeAbsolute = currentPrice - price24hAgo;
      change24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
    }

    changes.push({
      mint,
      currentPrice,
      price24hAgo,
      change24h,
      changeAbsolute,
    });
  }

  return changes;
}
