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
      <div className="bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (reserve.error) {
    return (
      <div className="bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-800">
        <div className="text-red-400 text-center">
          <p className="font-semibold">Error loading reserve</p>
          <p className="text-sm mt-2">{reserve.error}</p>
        </div>
      </div>
    );
  }

  const supplyPercent = (reserve.circulatingSupply / reserve.totalSupply) * 100;

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6 max-w-md mx-auto border border-gray-800">
      {/* Demo Mode Banner */}
      {reserve.isMockData && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg px-4 py-2 mb-4 text-center">
          <span className="text-amber-400 text-sm font-medium">Demo Mode</span>
          <span className="text-amber-300 text-sm"> - Using simulated data</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {reserve.icon && (
            <img
              src={reserve.icon}
              alt={reserve.symbol}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{reserve.name}</h2>
            <p className="text-gray-400">{reserve.symbol} Reserve</p>
          </div>
        </div>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !h-10" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Current Price</p>
          <p className="text-xl font-bold text-white">{reserve.currentPriceFormatted}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400">Reserve Balance</p>
          <p className="text-xl font-bold text-white">{reserve.reserveBalanceFormatted}</p>
        </div>
      </div>

      {/* Supply Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Circulating Supply</span>
          <span>{formatTokenAmount(reserve.circulatingSupply, 0)} / {formatTokenAmount(reserve.totalSupply, 0)}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${supplyPercent}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">{supplyPercent.toFixed(4)}% released</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl bg-gray-800 p-1 mb-4">
        <button
          onClick={() => setMode('buy')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            mode === 'buy'
              ? 'bg-gray-700 text-purple-400 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            mode === 'sell'
              ? 'bg-gray-700 text-purple-400 shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Input */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{mode === 'buy' ? 'You pay' : 'You sell'}</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
          />
          <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg min-w-[100px] justify-center">
            {mode === 'buy' ? (
              <>
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">$</div>
                <span className="text-white font-medium">USDF</span>
              </>
            ) : (
              <>
                {reserve.icon ? (
                  <img src={reserve.icon} alt={reserve.symbol} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {reserve.symbol.charAt(0)}
                  </div>
                )}
                <span className="text-white font-medium">{reserve.symbol}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div className="bg-purple-900/30 border border-purple-800 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">You receive</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {formatTokenAmount(quote.output, 4)}
              </span>
              {mode === 'buy' ? (
                <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-md">
                  {reserve.icon ? (
                    <img src={reserve.icon} alt={reserve.symbol} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {reserve.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">{reserve.symbol}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-md">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">$</div>
                  <span className="text-white text-sm font-medium">USDF</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg. Price</span>
            <span className="text-gray-200">{formatUsd(quote.avgPrice)}</span>
          </div>
          {quote.priceImpact.abs().isGreaterThan(0.01) && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price Impact</span>
              <span className={quote.priceImpact.isGreaterThan(1) ? 'text-orange-400' : 'text-gray-200'}>
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
          )}
          {mode === 'buy' && quote.fee && quote.fee.isGreaterThan(0) && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fee ({quote.feePercent}%)</span>
              <span className="text-gray-200">{formatUsd(quote.fee)}</span>
            </div>
          )}
          {mode === 'sell' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Protocol Fee (1%)</span>
              <span className="text-gray-200">Included</span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        disabled={!wallet.connected || !quote}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          wallet.connected && quote
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
        <p className="text-center text-sm text-orange-400 mt-4">
          Transactions disabled - USDF not yet available
        </p>
      )}
    </div>
  );
}
