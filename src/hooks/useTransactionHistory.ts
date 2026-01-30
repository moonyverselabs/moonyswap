'use client';

import { useState, useEffect, useCallback } from 'react';
import { FLIPCASH_PROGRAM_ID, TOKEN_DECIMALS, USDF_DECIMALS } from '@/lib/constants';

export interface Trade {
  signature: string;
  timestamp: number;
  type: 'buy' | 'sell';
  tokenAmount: number;
  usdAmount: number;
  pricePerToken: number;
  wallet: string;
  slot: number;
}

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  slot: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: Array<{
      userAccount: string;
      tokenAccount: string;
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
    }>;
  }>;
  instructions?: Array<{
    programId: string;
    data: string;
    accounts: string[];
    innerInstructions?: Array<{
      programId: string;
      data: string;
      accounts: string[];
    }>;
  }>;
}

/**
 * Fetch transaction history using Helius Enhanced API
 */
export function useTransactionHistory(
  poolAddress: string,
  tokenMint: string,
  usdMint: string,
  currencyVault?: string,
  baseVault?: string
) {
  // Build vault set for this pool
  const vaultSet = new Set<string>();
  if (currencyVault) vaultSet.add(currencyVault);
  if (baseVault) vaultSet.add(baseVault);
  // Add known JFY vaults as fallback
  vaultSet.add('BMYftxDcbLDTzRCkLmQ9amwNgqsZ74A1wsd1gURum3Ep');
  vaultSet.add('3QEYi2emN2ggYGG66RYdgDhNnumXTuQec4Ar6o5qpb6R');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const fetchTrades = useCallback(async (before?: string) => {
    if (!poolAddress || poolAddress === '11111111111111111111111111111111') {
      setTrades([]);
      setLoading(false);
      return;
    }

    // Extract Helius API key from RPC URL
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || '';
    const apiKeyMatch = rpcUrl.match(/api-key=([^&]+)/);
    if (!apiKeyMatch) {
      setError('Helius API key not configured');
      setLoading(false);
      return;
    }
    const apiKey = apiKeyMatch[1];

    try {
      // Use Helius parsed transaction history API
      let url = `https://api.helius.xyz/v0/addresses/${poolAddress}/transactions?api-key=${apiKey}&limit=50`;
      if (before) {
        url += `&before=${before}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status}`);
      }

      const transactions: HeliusTransaction[] = await response.json();

      // Parse transactions into trades
      const newTrades: Trade[] = [];

      for (const tx of transactions) {
        const trade = parseHeliusTrade(tx, tokenMint, usdMint, vaultSet);
        if (trade) {
          newTrades.push(trade);
        }
      }

      if (before) {
        setTrades(prev => [...prev, ...newTrades]);
      } else {
        setTrades(newTrades);
      }

      // Track pagination
      if (transactions.length > 0) {
        setLastSignature(transactions[transactions.length - 1].signature);
      }
      setHasMore(transactions.length === 50);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      if (!before) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [poolAddress, tokenMint, usdMint]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && lastSignature) {
      setLoadingMore(true);
      fetchTrades(lastSignature);
    }
  }, [loadingMore, hasMore, lastSignature, fetchTrades]);

  const refresh = useCallback(() => {
    setLoading(true);
    setLastSignature(null);
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    fetchTrades();

    // Auto-refresh every 30 seconds for new transactions
    const interval = setInterval(() => {
      fetchTrades();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTrades]);

  return { trades, loading, error, hasMore, loadingMore, loadMore, refresh };
}

/**
 * Parse a Helius transaction into a Trade
 */
function parseHeliusTrade(
  tx: HeliusTransaction,
  tokenMint: string,
  usdMint: string,
  vaults: Set<string>
): Trade | null {
  try {
    // Check if this transaction involves our program
    const hasFlipCashIx = tx.instructions?.some(
      ix => ix.programId === FLIPCASH_PROGRAM_ID.toString()
    );

    if (!hasFlipCashIx) return null;

    // Look for token transfers to determine trade type and amounts
    const tokenTransfers = tx.tokenTransfers || [];

    let tokenAmount = 0;
    let usdAmount = 0;
    let wallet = '';
    let type: 'buy' | 'sell' | null = null;

    // Find token (currency) transfers - these tell us the trade direction
    const tokenMintTransfers = tokenTransfers.filter(t => t.mint === tokenMint);
    const usdMintTransfers = tokenTransfers.filter(t => t.mint === usdMint);

    // Analyze token transfers to determine buy/sell
    for (const transfer of tokenMintTransfers) {
      const from = transfer.fromUserAccount || '';
      const to = transfer.toUserAccount || '';

      // Skip if both are vaults or same address
      if (from === to) continue;

      tokenAmount = Math.max(tokenAmount, transfer.tokenAmount);

      // If FROM is a vault and TO is not, it's a BUY (user receives tokens)
      if (vaults.has(from) && !vaults.has(to) && to) {
        type = 'buy';
        wallet = to;
      }
      // If TO is a vault and FROM is not, it's a SELL (user sends tokens)
      else if (vaults.has(to) && !vaults.has(from) && from) {
        type = 'sell';
        wallet = from;
      }
      // If neither is a known vault, use heuristics
      else if (!type && to && from) {
        // Assume the non-feePayer address in a pair is the user
        // Or just pick the recipient for now
        type = 'buy';
        wallet = to;
      }
    }

    // Get USD amount from transfers
    for (const transfer of usdMintTransfers) {
      usdAmount = Math.max(usdAmount, transfer.tokenAmount);
    }

    // Fallback: use accountData balance changes if transfers didn't work
    if ((tokenAmount === 0 || !type) && tx.accountData) {
      for (const account of tx.accountData) {
        for (const change of account.tokenBalanceChanges || []) {
          const rawAmount = parseFloat(change.rawTokenAmount.tokenAmount);
          const decimals = change.rawTokenAmount.decimals;
          const adjustedAmount = Math.abs(rawAmount) / Math.pow(10, decimals);
          const userAccount = change.userAccount || '';

          // Skip vault accounts
          if (vaults.has(userAccount)) continue;

          if (change.mint === tokenMint && adjustedAmount > 0) {
            tokenAmount = Math.max(tokenAmount, adjustedAmount);
            // Positive = received tokens = buy, Negative = sent tokens = sell
            if (rawAmount > 0 && !type) {
              type = 'buy';
              wallet = userAccount;
            } else if (rawAmount < 0 && !type) {
              type = 'sell';
              wallet = userAccount;
            }
          } else if (change.mint === usdMint && adjustedAmount > 0) {
            usdAmount = Math.max(usdAmount, adjustedAmount);
          }
        }
      }
    }

    // Must have type and token amount to be valid
    if (!type || tokenAmount === 0) return null;

    const pricePerToken = usdAmount > 0 && tokenAmount > 0
      ? usdAmount / tokenAmount
      : 0;

    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      type,
      tokenAmount,
      usdAmount,
      pricePerToken,
      wallet: wallet || 'Unknown',
      slot: tx.slot,
    };
  } catch (err) {
    console.error('Error parsing trade:', err);
    return null;
  }
}
