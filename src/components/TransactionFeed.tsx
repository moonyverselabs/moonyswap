'use client';

import { useTransactionFeed } from '@/hooks/useTransactionFeed';
import { formatTokenAmount, formatUsd } from '@/lib/curve';

interface TransactionFeedProps {
  poolAddress: string;
  tokenSymbol: string;
}

export function TransactionFeed({ poolAddress, tokenSymbol }: TransactionFeedProps) {
  const { transactions, loading, error } = useTransactionFeed(poolAddress);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold text-sm mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-6 bg-gray-800 rounded" />
              <div className="flex-1 h-4 bg-gray-800 rounded" />
              <div className="w-16 h-4 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold text-sm mb-3">Recent Transactions</h3>
        <p className="text-gray-500 text-sm">Unable to load transactions</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-white font-semibold text-sm mb-3">Recent Transactions</h3>
        <p className="text-gray-500 text-sm">No recent buy/sell activity</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-white font-semibold text-sm mb-4">Recent Transactions</h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <a
            key={tx.signature}
            href={`https://solscan.io/tx/${tx.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            {/* Type Badge */}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                tx.type === 'buy'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-red-900/50 text-red-400'
              }`}
            >
              {tx.type === 'buy' ? 'BUY' : 'SELL'}
            </span>

            {/* Amount */}
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm">
                {formatTokenAmount(tx.tokenAmount, 2)} {tokenSymbol}
              </span>
              <span className="text-gray-500 text-sm ml-2">
                for {formatUsd(tx.usdfAmount)}
              </span>
            </div>

            {/* Time */}
            <span className="text-gray-500 text-xs flex-shrink-0">
              {formatTimeAgo(tx.timestamp)}
            </span>

            {/* External Link Icon */}
            <svg
              className="w-3 h-3 text-gray-600 group-hover:text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}
