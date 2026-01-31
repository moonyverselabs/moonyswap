'use client';

import { useState, useMemo } from 'react';
import { useTransactionHistory, Trade } from '@/hooks/useTransactionHistory';
import { formatTokenAmount, formatUsd } from '@/lib/curve';
import { USDF_MINT } from '@/lib/constants';

type TypeFilter = 'all' | 'buy' | 'sell';
type AmountFilter = 0 | 100 | 1000 | 10000;

interface TransactionHistoryProps {
  poolAddress: string;
  tokenMint: string;
  tokenSymbol: string;
}

export function TransactionHistory({ poolAddress, tokenMint, tokenSymbol }: TransactionHistoryProps) {
  const { trades, loading, error, hasMore, loadingMore, loadMore, refresh } = useTransactionHistory(
    poolAddress,
    tokenMint,
    USDF_MINT.toString()
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [amountFilter, setAmountFilter] = useState<AmountFilter>(0);

  // Apply filters
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Type filter
      if (typeFilter !== 'all' && trade.type !== typeFilter) {
        return false;
      }
      // Amount filter (based on USD value)
      if (amountFilter > 0 && trade.usdAmount < amountFilter) {
        return false;
      }
      return true;
    });
  }, [trades, typeFilter, amountFilter]);

  if (loading) {
    return (
      <div className="bg-[#141418] rounded-xl border border-[#2a2a30] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a30] flex items-center justify-between">
          <h3 className="text-moony-gradient font-semibold text-sm">Transaction History</h3>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-20 h-4 bg-[#2a2a30] rounded" />
                <div className="w-12 h-5 bg-[#2a2a30] rounded" />
                <div className="flex-1 h-4 bg-[#2a2a30] rounded" />
                <div className="w-16 h-4 bg-[#2a2a30] rounded" />
                <div className="w-20 h-4 bg-[#2a2a30] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#141418] rounded-xl border border-[#2a2a30] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a30]">
          <h3 className="text-moony-gradient font-semibold text-sm">Transaction History</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-[#707078] text-sm">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-2 text-sm bg-[#1a1a1f] hover:bg-[#2a2a30] text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141418] rounded-xl border border-[#2a2a30] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2a2a30]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-moony-gradient font-semibold text-sm">Transaction History</h3>
            {trades.length > 0 && (
              <span className="text-xs text-[#707078]">
                {filteredTrades.length === trades.length
                  ? `${trades.length} trades`
                  : `${filteredTrades.length} of ${trades.length}`}
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            className="text-[#707078] hover:text-white transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a30]">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-[#2a2a30] text-white'
                  : 'bg-transparent text-[#a0a0a8] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('buy')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === 'buy'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-transparent text-[#a0a0a8] hover:text-green-400'
              }`}
            >
              Buys
            </button>
            <button
              onClick={() => setTypeFilter('sell')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === 'sell'
                  ? 'bg-red-900/50 text-red-400'
                  : 'bg-transparent text-[#a0a0a8] hover:text-red-400'
              }`}
            >
              Sells
            </button>
          </div>

          {/* Amount Filter */}
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a30]">
            {([0, 100, 1000, 10000] as AmountFilter[]).map((amount) => (
              <button
                key={amount}
                onClick={() => setAmountFilter(amount)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  amountFilter === amount
                    ? 'bg-[#2a2a30] text-white'
                    : 'bg-transparent text-[#a0a0a8] hover:text-white'
                }`}
              >
                {amount === 0 ? 'Any' : `>$${amount.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[#707078] text-sm">
            {trades.length === 0 ? 'No trades found' : 'No trades match filters'}
          </p>
          {trades.length > 0 && (typeFilter !== 'all' || amountFilter > 0) && (
            <button
              onClick={() => { setTypeFilter('all'); setAmountFilter(0); }}
              className="mt-2 text-xs text-[#D8C5FD] hover:text-[#FFF2D9]"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2 text-xs text-[#707078] border-b border-[#2a2a30]/50 bg-[#141418]/50">
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-right">Maker</div>
          </div>

          {/* Trades List */}
          <div className="max-h-[500px] overflow-y-auto">
            {filteredTrades.map((trade) => (
              <TradeRow key={trade.signature} trade={trade} tokenSymbol={tokenSymbol} />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center border-t border-[#2a2a30]/50">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-sm bg-[#1a1a1f] hover:bg-[#2a2a30] disabled:bg-[#1a1a1f]/50 text-white disabled:text-[#707078] rounded-lg transition-colors"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TradeRow({ trade, tokenSymbol }: { trade: Trade; tokenSymbol: string }) {
  const isBuy = trade.type === 'buy';

  return (
    <a
      href={`https://solscan.io/tx/${trade.signature}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b border-[#2a2a30]/30 hover:bg-[#1a1a1f]/30 transition-colors ${
        isBuy ? 'hover:bg-green-900/10' : 'hover:bg-red-900/10'
      }`}
    >
      {/* Time */}
      <div className="col-span-2 text-[#a0a0a8] text-xs flex items-center">
        {formatTimestamp(trade.timestamp)}
      </div>

      {/* Type Badge */}
      <div className="col-span-1 flex items-center">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isBuy
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {isBuy ? 'BUY' : 'SELL'}
        </span>
      </div>

      {/* Amount */}
      <div className={`col-span-3 text-right font-mono ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
        {isBuy ? '+' : '-'}{formatTokenAmount(trade.tokenAmount, 2)} {tokenSymbol}
      </div>

      {/* Price */}
      <div className="col-span-2 text-right text-[#a0a0a8] font-mono">
        {trade.pricePerToken > 0 ? formatUsd(trade.pricePerToken) : '-'}
      </div>

      {/* Total */}
      <div className="col-span-2 text-right text-white font-mono">
        {trade.usdAmount > 0 ? formatUsd(trade.usdAmount) : '-'}
      </div>

      {/* Maker */}
      <div className="col-span-2 text-right">
        <span className="text-[#707078] font-mono text-xs hover:text-[#D8C5FD] transition-colors">
          {truncateAddress(trade.wallet)}
        </span>
      </div>
    </a>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // For very recent (< 1 hour), show relative time
  if (diffMins < 60) {
    if (diffMins < 1) return 'Just now';
    return `${diffMins}m ago`;
  }

  // For today, show time
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // For this week, show day and time
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Otherwise show date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address || '-';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
