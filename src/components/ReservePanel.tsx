'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useReserve } from '@/hooks/useReserve';
import { useReserveByMint } from '@/hooks/useReserveByMint';
import { getTokenCost, getTokensForUsdf, getSellValue, formatUsd, formatTokenAmount } from '@/lib/curve';
import { BUY_FEE_BPS, isFeeExempt } from '@/lib/constants';
import BigNumber from 'bignumber.js';

interface ReservePanelProps {
  tokenKey?: string;
  tokenMint?: string;
}

export function ReservePanel({ tokenKey = 'jeffy', tokenMint }: ReservePanelProps) {
  const wallet = useWallet();

  // Use mint-based loading if tokenMint is provided, otherwise use key-based
  const reserveByKey = useReserve(tokenKey);
  const reserveByMint = useReserveByMint(tokenMint || '');
  const reserve = tokenMint ? reserveByMint : reserveByKey;
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  // Check if this token is fee-exempt (MNY)
  const isExempt = tokenMint ? isFeeExempt(tokenMint) : false;

  const quote = useMemo(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return null;
    }

    const numAmount = Number(amount);

    try {
      if (mode === 'buy') {
        // User enters USDF amount, deduct fee (unless exempt), get tokens out
        const feeAmount = isExempt ? new BigNumber(0) : new BigNumber(numAmount).multipliedBy(BUY_FEE_BPS).dividedBy(10000);
        const netAmount = new BigNumber(numAmount).minus(feeAmount);
        const tokensOut = getTokensForUsdf(reserve.circulatingSupply, netAmount);
        const avgPrice = new BigNumber(numAmount).dividedBy(tokensOut);
        return {
          input: numAmount,
          inputLabel: 'USDF',
          output: tokensOut,
          outputLabel: reserve.symbol,
          avgPrice,
          priceImpact: avgPrice.minus(reserve.currentPrice).dividedBy(reserve.currentPrice).multipliedBy(100),
          fee: feeAmount,
          feePercent: BUY_FEE_BPS / 100,
        };
      } else {
        // User enters token amount, get USDF out (protocol fee already included in getSellValue)
        const usdfOut = getSellValue(reserve.circulatingSupply, numAmount);
        const avgPrice = usdfOut.dividedBy(numAmount);
        return {
          input: numAmount,
          inputLabel: reserve.symbol,
          output: usdfOut,
          outputLabel: 'USDF',
          avgPrice,
          priceImpact: reserve.currentPrice.minus(avgPrice).dividedBy(reserve.currentPrice).multipliedBy(100),
          fee: null,
          feePercent: 0,
        };
      }
    } catch (err) {
      return null;
    }
  }, [amount, mode, reserve, isExempt]);

  if (reserve.loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-800 rounded-lg"></div>
          <div className="h-16 bg-gray-800 rounded-lg"></div>
          <div className="h-12 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (reserve.error) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-red-400 text-center">
          <p className="font-semibold text-sm">Error loading reserve</p>
          <p className="text-xs mt-1">{reserve.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      {/* Header with Wallet */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Swap</h3>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-8 !text-xs !px-3" />
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg bg-gray-800 p-1 mb-4">
        <button
          onClick={() => setMode('buy')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'buy'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'sell'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input */}
      <div className="bg-gray-800 rounded-lg p-3 mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{mode === 'buy' ? 'You pay' : 'You sell'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-gray-600 min-w-0"
          />
          <div className="flex items-center gap-1.5 bg-gray-700 px-2.5 py-1.5 rounded-lg flex-shrink-0">
            {mode === 'buy' ? (
              <>
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">$</div>
                <span className="text-white text-sm font-medium">USDF</span>
              </>
            ) : (
              <>
                {reserve.icon ? (
                  <img src={reserve.icon} alt={reserve.symbol} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {reserve.symbol.charAt(0)}
                  </div>
                )}
                <span className="text-white text-sm font-medium">{reserve.symbol}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">You receive</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">
                {formatTokenAmount(quote.output, 4)}
              </span>
              {mode === 'buy' ? (
                <div className="flex items-center gap-1 bg-gray-700 px-1.5 py-0.5 rounded">
                  {reserve.icon ? (
                    <img src={reserve.icon} alt={reserve.symbol} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {reserve.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="text-white text-xs font-medium">{reserve.symbol}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-gray-700 px-1.5 py-0.5 rounded">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">$</div>
                  <span className="text-white text-xs font-medium">USDF</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Avg. Price</span>
            <span className="text-gray-300">{formatUsd(quote.avgPrice)}</span>
          </div>
          {quote.priceImpact.abs().isGreaterThan(0.01) && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Price Impact</span>
              <span className={quote.priceImpact.isGreaterThan(1) ? 'text-orange-400' : 'text-gray-300'}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
          )}
          {mode === 'buy' && quote.fee && quote.fee.isGreaterThan(0) && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fee ({quote.feePercent}%)</span>
              <span className="text-gray-300">{formatUsd(quote.fee)}</span>
            </div>
          )}
          {mode === 'sell' && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Protocol Fee (1%)</span>
              <span className="text-gray-300">Included</span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        disabled={!wallet.connected || !quote}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
          wallet.connected && quote
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        {!wallet.connected
          ? 'Connect Wallet'
          : !quote
          ? 'Enter Amount'
          : mode === 'buy'
          ? `Buy ${reserve.symbol}`
          : `Sell ${reserve.symbol}`}
      </button>

      {/* Warning */}
      {wallet.connected && quote && (
        <p className="text-center text-xs text-orange-400 mt-3">
          Transactions disabled - USDF not yet available
        </p>
      )}
    </div>
  );
}
