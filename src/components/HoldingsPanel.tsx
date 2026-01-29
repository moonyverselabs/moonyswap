'use client';

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { getSpotPrice, getTokenCost, formatUsd, formatTokenAmount } from '@/lib/curve';
import { TOKEN_DECIMALS, MOCK_MNY } from '@/lib/constants';
import BigNumber from 'bignumber.js';

interface HoldingsPanelProps {
  tokenMint: string;
  tokenSymbol: string;
  currentPrice: BigNumber;
  currentReserve: BigNumber;
  circulatingSupply: number;
}

// Find supply at a given reserve
function supplyAtReserve(targetReserve: number): number {
  let low = 0, high = 21_000_000;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const res = getTokenCost(0, mid).toNumber();
    if (res < targetReserve) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// Find supply at a given price
function supplyAtPrice(targetPrice: number): number {
  let low = 0, high = 21_000_000;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const price = getSpotPrice(mid).toNumber();
    if (price < targetPrice) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function HoldingsPanel({
  tokenMint,
  tokenSymbol,
  currentPrice,
  currentReserve,
  circulatingSupply,
}: HoldingsPanelProps) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calcMode, setCalcMode] = useState<'price' | 'reserve'>('reserve');
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    async function fetchBalance() {
      if (!connected || !publicKey || !tokenMint) {
        setBalance(null);
        return;
      }

      setLoading(true);
      try {
        // Use real mint for mock tokens
        const isMockMny = MOCK_MNY.enabled && tokenMint === MOCK_MNY.mockMint;
        const actualMint = isMockMny ? MOCK_MNY.realMint : tokenMint;
        const mint = new PublicKey(actualMint);
        const ata = await getAssociatedTokenAddress(mint, publicKey);
        const accountInfo = await connection.getAccountInfo(ata);

        if (accountInfo) {
          const rawBalance = accountInfo.data.readBigUInt64LE(64);
          const wholeBalance = Number(rawBalance) / Math.pow(10, TOKEN_DECIMALS);
          setBalance(wholeBalance);
        } else {
          setBalance(0);
        }
      } catch (err) {
        console.error('Error fetching token balance:', err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connection, publicKey, connected, tokenMint]);

  if (!connected) {
    // Show teaser with CTA to connect
    const exampleBalance = 1000;
    const exampleValue = currentPrice.multipliedBy(exampleBalance);
    const currentReserveNum = currentReserve.toNumber();

    const previewMilestones = [1_000, 10_000, 100_000, 1_000_000].filter(
      m => m > currentReserveNum
    ).slice(0, 3);

    const previewProjections = previewMilestones.map(milestone => {
      const supplyAtMilestone = supplyAtReserve(milestone);
      const priceAtMilestone = getSpotPrice(supplyAtMilestone);
      const valueAtMilestone = priceAtMilestone.multipliedBy(exampleBalance);
      const gainPercent = valueAtMilestone.minus(exampleValue).dividedBy(exampleValue).multipliedBy(100);

      const label = milestone >= 1_000_000
        ? `$${milestone / 1_000_000}M`
        : `$${milestone / 1_000}K`;

      return { milestone, label, value: valueAtMilestone, gainPercent };
    });

    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">What if you held 1,000 {tokenSymbol}?</h3>

        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Current value</div>
          <div className="text-2xl font-bold text-white">{formatUsd(exampleValue)}</div>
        </div>

        <div className="text-gray-400 text-sm mb-3">If reserve reaches...</div>
        <div className="space-y-2 mb-5">
          {previewProjections.map(proj => (
            <div
              key={proj.milestone}
              className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
            >
              <span className="text-white font-medium">{proj.label}</span>
              <div className="text-right">
                <div className="text-white font-medium">{formatUsd(proj.value)}</div>
                <div className="text-green-400 text-xs">+{proj.gainPercent.toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => document.querySelector<HTMLButtonElement>('.wallet-adapter-button')?.click()}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Connect Wallet to See Your Holdings
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Your Holdings</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (balance === null || balance === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Your Holdings</h3>
        <p className="text-gray-400 text-sm">
          You don't hold any {tokenSymbol} yet.
        </p>
      </div>
    );
  }

  const currentValue = currentPrice.multipliedBy(balance);
  const currentReserveNum = currentReserve.toNumber();

  // Calculate milestones based on current reserve
  const milestones = [1_000, 10_000, 100_000, 1_000_000, 10_000_000].filter(
    m => m > currentReserveNum
  );

  // Calculate value at each milestone
  const projections = milestones.map(milestone => {
    const supplyAtMilestone = supplyAtReserve(milestone);
    const priceAtMilestone = getSpotPrice(supplyAtMilestone);
    const valueAtMilestone = priceAtMilestone.multipliedBy(balance);
    const gain = valueAtMilestone.minus(currentValue);
    const gainPercent = gain.dividedBy(currentValue).multipliedBy(100);

    const label = milestone >= 1_000_000
      ? `$${milestone / 1_000_000}M`
      : `$${milestone / 1_000}K`;

    return {
      milestone,
      label,
      price: priceAtMilestone,
      value: valueAtMilestone,
      gain,
      gainPercent,
    };
  });

  const supplyPercent = (balance / 21_000_000) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-gray-900 rounded-xl p-6 border border-purple-800/50">
      <h3 className="text-white font-semibold mb-4">Your Holdings</h3>

      {/* Current Balance */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-gray-400 text-sm">Balance</span>
          <span className="text-gray-400 text-xs">{supplyPercent.toFixed(6)}% of supply</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {formatTokenAmount(balance, 2)} {tokenSymbol}
        </div>
        <div className="text-lg text-purple-400">
          {formatUsd(currentValue)}
        </div>
      </div>

      {/* Milestone Projections */}
      {projections.length > 0 && (
        <div className="mb-6">
          <div className="text-gray-400 text-sm mb-3">If reserve reaches...</div>
          <div className="space-y-2">
            {projections.slice(0, 4).map(proj => (
              <div
                key={proj.milestone}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="text-white font-medium">{proj.label}</span>
                  <span className="text-gray-500 text-xs ml-2">reserve</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{formatUsd(proj.value)}</div>
                  <div className="text-green-400 text-xs">
                    +{proj.gainPercent.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Calculator */}
      <div className="border-t border-gray-700 pt-4">
        <div className="text-gray-400 text-sm mb-3">Custom calculator</div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-gray-800 p-1 mb-3">
          <button
            onClick={() => { setCalcMode('reserve'); setCustomInput(''); }}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              calcMode === 'reserve'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            At Reserve
          </button>
          <button
            onClick={() => { setCalcMode('price'); setCustomInput(''); }}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              calcMode === 'price'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            At Price
          </button>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400">$</span>
          <input
            type="number"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={calcMode === 'reserve' ? 'Enter reserve size' : 'Enter token price'}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Result */}
        {customInput && !isNaN(Number(customInput)) && Number(customInput) > 0 && (() => {
          const inputNum = Number(customInput);
          let targetPrice: BigNumber;
          let targetReserve: number;

          if (calcMode === 'reserve') {
            targetReserve = inputNum;
            const supply = supplyAtReserve(targetReserve);
            targetPrice = getSpotPrice(supply);
          } else {
            targetPrice = new BigNumber(inputNum);
            const supply = supplyAtPrice(inputNum);
            targetReserve = getTokenCost(0, supply).toNumber();
          }

          const valueAtTarget = targetPrice.multipliedBy(balance);
          const gain = valueAtTarget.minus(currentValue);
          const gainPercent = gain.dividedBy(currentValue).multipliedBy(100);

          return (
            <div className="bg-purple-900/30 border border-purple-800/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">
                  {calcMode === 'reserve' ? 'At' : 'At price'} {formatUsd(new BigNumber(calcMode === 'reserve' ? targetReserve : inputNum))}
                  {calcMode === 'reserve' && <span className="text-gray-500 ml-1">reserve</span>}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-white font-bold text-lg">{formatUsd(valueAtTarget)}</div>
                  {calcMode === 'reserve' && (
                    <div className="text-gray-400 text-xs">Price: {formatUsd(targetPrice)}</div>
                  )}
                  {calcMode === 'price' && (
                    <div className="text-gray-400 text-xs">Reserve: {formatUsd(new BigNumber(targetReserve))}</div>
                  )}
                </div>
                <div className={`text-lg font-semibold ${gainPercent.isGreaterThan(0) ? 'text-green-400' : 'text-red-400'}`}>
                  {gainPercent.isGreaterThan(0) ? '+' : ''}{gainPercent.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
