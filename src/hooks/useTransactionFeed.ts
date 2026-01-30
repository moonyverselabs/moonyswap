'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';
import bs58 from 'bs58';
import { FLIPCASH_PROGRAM_ID, TOKEN_DECIMALS, USDF_DECIMALS } from '@/lib/constants';

export interface ReserveTransaction {
  signature: string;
  type: 'buy' | 'sell';
  tokenAmount: number;
  usdfAmount: number;
  timestamp: number;
  wallet: string;
}

/**
 * Fetch and parse recent transactions for a reserve pool
 */
export function useTransactionFeed(poolAddress: string, limit: number = 15) {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<ReserveTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    // Skip if no pool address or it's the system program placeholder
    if (!poolAddress || poolAddress === '11111111111111111111111111111111') {
      setTransactions([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const pool = new PublicKey(poolAddress);

      // Get recent transaction signatures
      const signatures = await connection.getSignaturesForAddress(pool, {
        limit: limit * 2, // Fetch extra in case some aren't buy/sell
      });

      if (signatures.length === 0) {
        setTransactions([]);
        setLoading(false);
        setError(null);
        return;
      }

      // Fetch full transaction details
      const txs = await connection.getParsedTransactions(
        signatures.map(s => s.signature),
        { maxSupportedTransactionVersion: 0 }
      );

      const parsed: ReserveTransaction[] = [];

      for (let i = 0; i < txs.length && parsed.length < limit; i++) {
        const tx = txs[i];
        const sig = signatures[i];

        if (!tx || !tx.meta || tx.meta.err) continue;

        const result = parseTransaction(tx, sig.signature, sig.blockTime ?? null);
        if (result) {
          parsed.push(result);
        }
      }

      setTransactions(parsed);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction feed:', err);
      // Don't show error for common RPC issues, just show empty state
      setTransactions([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [connection, poolAddress, limit]);

  useEffect(() => {
    fetchTransactions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return { transactions, loading, error, refresh: fetchTransactions };
}

/**
 * Parse a transaction to extract buy/sell info
 */
function parseTransaction(
  tx: ParsedTransactionWithMeta,
  signature: string,
  blockTime: number | null
): ReserveTransaction | null {
  try {
    const instructions = tx.transaction.message.instructions;

    // Find Flipcash program instruction
    const flipcashIx = instructions.find(
      (ix) => 'programId' in ix && ix.programId.toString() === FLIPCASH_PROGRAM_ID.toString()
    );

    if (!flipcashIx || !('data' in flipcashIx)) return null;

    // Decode instruction discriminator
    const data = bs58.decode(flipcashIx.data);
    const discriminator = data[0];

    // 4 = buy_tokens, 5 = sell_tokens
    const type = discriminator === 4 ? 'buy' : discriminator === 5 ? 'sell' : null;
    if (!type) return null;

    // Parse token balance changes from pre/post balances
    const preBalances = tx.meta?.preTokenBalances || [];
    const postBalances = tx.meta?.postTokenBalances || [];

    let tokenAmount = 0;
    let usdfAmount = 0;
    let wallet = '';

    // Find the user's balance changes (not the pool vaults)
    for (const post of postBalances) {
      const pre = preBalances.find(
        p => p.accountIndex === post.accountIndex
      );

      if (!pre || !post.uiTokenAmount || !pre.uiTokenAmount) continue;

      const preAmount = pre.uiTokenAmount.uiAmount || 0;
      const postAmount = post.uiTokenAmount.uiAmount || 0;
      const diff = Math.abs(postAmount - preAmount);
      const decimals = post.uiTokenAmount.decimals;

      // Identify by decimals: TOKEN_DECIMALS (10) vs USDF_DECIMALS (6)
      if (decimals === TOKEN_DECIMALS && diff > 0) {
        tokenAmount = diff;
        // Get wallet from owner
        if (post.owner && !isPoolVault(post.owner)) {
          wallet = post.owner;
        }
      } else if (decimals === USDF_DECIMALS && diff > 0) {
        usdfAmount = diff;
        if (!wallet && post.owner && !isPoolVault(post.owner)) {
          wallet = post.owner;
        }
      }
    }

    // If we couldn't find amounts, skip this transaction
    if (tokenAmount === 0 && usdfAmount === 0) return null;

    return {
      signature,
      type,
      tokenAmount,
      usdfAmount,
      timestamp: blockTime || Math.floor(Date.now() / 1000),
      wallet: wallet || 'Unknown',
    };
  } catch (err) {
    console.error('Error parsing transaction:', err);
    return null;
  }
}

// Simple check if an address looks like a pool vault (we'll refine this if needed)
function isPoolVault(address: string): boolean {
  // Pool vaults are PDAs, but for now just return false
  // The user wallet will be different from vault addresses
  return false;
}
