'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useDiscoverReserves, DiscoveredReserve } from '@/hooks/useDiscoverReserves';
import { getTokensForUsdf, getSellValue, getTokenCost, getSpotPrice, formatUsd, formatTokenAmount } from '@/lib/curve';
import { SELL_FEE_BPS, BUY_FEE_BPS, isFeeExempt } from '@/lib/constants';
import BigNumber from 'bignumber.js';

interface SwapToken {
  type: 'usdf' | 'currency';
  symbol: string;
  icon: string;
  mint?: string;
  reserve?: DiscoveredReserve;
}

const USDF_TOKEN: SwapToken = {
  type: 'usdf',
  symbol: 'USDF',
  icon: '',
  mint: 'usdf',
};

interface ReservePanelProps {
  tokenKey?: string;
  tokenMint?: string;
}

export function ReservePanel({ tokenMint }: ReservePanelProps) {
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { reserves, loading: reservesLoading } = useDiscoverReserves();

  const [inputToken, setInputToken] = useState<SwapToken>(USDF_TOKEN);
  const [outputToken, setOutputToken] = useState<SwapToken | null>(null);
  const [inputUsdAmount, setInputUsdAmount] = useState(''); // Always in USD
  const [showInputSelector, setShowInputSelector] = useState(false);
  const [showOutputSelector, setShowOutputSelector] = useState(false);
  const [coinbaseLoading, setCoinbaseLoading] = useState(false);
  const [pendingCoinbase, setPendingCoinbase] = useState(false);

  // Build available tokens list
  const availableTokens: SwapToken[] = useMemo(() => {
    const tokens: SwapToken[] = [USDF_TOKEN];
    for (const r of reserves) {
      tokens.push({
        type: 'currency',
        symbol: r.metadata.symbol,
        icon: r.metadata.icon,
        mint: r.pool.currencyMint.toString(),
        reserve: r,
      });
    }
    return tokens;
  }, [reserves]);

  // Set default output token to the current page's token when reserves load
  useEffect(() => {
    if (!outputToken && availableTokens.length > 1 && tokenMint) {
      const pageToken = availableTokens.find(t => t.mint === tokenMint);
      if (pageToken) {
        setOutputToken(pageToken);
      } else if (availableTokens.length > 1) {
        setOutputToken(availableTokens[1]);
      }
    } else if (!outputToken && availableTokens.length > 1) {
      setOutputToken(availableTokens[1]);
    }
  }, [availableTokens, tokenMint, outputToken]);

  // Calculate input token amount from USD
  const inputTokenAmount = useMemo(() => {
    if (!inputUsdAmount || isNaN(Number(inputUsdAmount)) || Number(inputUsdAmount) <= 0) {
      return null;
    }
    const usdValue = Number(inputUsdAmount);

    if (inputToken.type === 'usdf') {
      return new BigNumber(usdValue); // 1:1 for USDF
    }
    if (inputToken.reserve) {
      // USD / price = token amount
      return new BigNumber(usdValue).dividedBy(inputToken.reserve.currentPrice);
    }
    return null;
  }, [inputUsdAmount, inputToken]);

  // Calculate quote
  const quote = useMemo(() => {
    if (!inputToken || !outputToken || !inputTokenAmount || inputTokenAmount.isLessThanOrEqualTo(0)) {
      return null;
    }

    const numTokens = inputTokenAmount.toNumber();

    try {
      // Same token - no swap needed
      if (inputToken.mint === outputToken.mint) {
        return null;
      }

      // USDF -> Currency (buy)
      if (inputToken.type === 'usdf' && outputToken.type === 'currency' && outputToken.reserve) {
        const isExempt = outputToken.mint ? isFeeExempt(outputToken.mint) : false;
        const feeAmount = isExempt ? new BigNumber(0) : new BigNumber(numTokens).multipliedBy(BUY_FEE_BPS).dividedBy(10000);
        const netAmount = new BigNumber(numTokens).minus(feeAmount);
        const tokensOut = getTokensForUsdf(outputToken.reserve.circulatingSupply, netAmount);

        // Value tokens at POST-trade spot price (your tokens are worth more after you buy!)
        const newSupply = outputToken.reserve.circulatingSupply + tokensOut.toNumber();
        const postTradeSpotPrice = getSpotPrice(newSupply);
        const outputUsdValue = postTradeSpotPrice.multipliedBy(tokensOut);

        // Price impact: how much the trade moves the spot price (positive = price went up)
        const preTradeSpotPrice = outputToken.reserve.currentPrice;
        const priceImpact = postTradeSpotPrice.minus(preTradeSpotPrice).dividedBy(preTradeSpotPrice).multipliedBy(100);

        return {
          route: 'direct' as const,
          routeLabel: `USDF → ${outputToken.symbol}`,
          outputTokenAmount: tokensOut,
          outputUsdValue,
          fees: feeAmount.isGreaterThan(0) ? [{ label: `Moonyswap (${BUY_FEE_BPS / 100}%)`, amount: feeAmount }] : [],
          priceImpact,
        };
      }

      // Currency -> USDF (sell)
      if (inputToken.type === 'currency' && outputToken.type === 'usdf' && inputToken.reserve) {
        // getSellValue returns USDF after 1% fee is deducted
        const usdfOut = getSellValue(inputToken.reserve.circulatingSupply, numTokens);

        // Calculate gross value from curve (before fee) to get accurate fee amount
        const newSupply = inputToken.reserve.circulatingSupply - numTokens;
        const grossValue = getTokenCost(newSupply, numTokens);
        const actualFee = grossValue.multipliedBy(SELL_FEE_BPS).dividedBy(10000);

        // Price impact: difference between spot price and average execution price (before fee)
        const spotPrice = inputToken.reserve.currentPrice;
        const avgExecutionPrice = grossValue.dividedBy(numTokens);
        const priceImpact = spotPrice.minus(avgExecutionPrice).dividedBy(spotPrice).multipliedBy(100).abs();

        return {
          route: 'direct' as const,
          routeLabel: `${inputToken.symbol} → USDF`,
          outputTokenAmount: usdfOut,
          outputUsdValue: usdfOut, // USDF is 1:1 with USD
          fees: [{ label: 'Flipcash (1%)', amount: actualFee }],
          priceImpact,
        };
      }

      // Currency -> Currency (routed through USDF)
      if (inputToken.type === 'currency' && outputToken.type === 'currency' &&
          inputToken.reserve && outputToken.reserve) {
        // Step 1: Sell input for USDF
        const usdfFromSell = getSellValue(inputToken.reserve.circulatingSupply, numTokens);

        // Calculate actual sell fee from gross value
        const newInputSupply = inputToken.reserve.circulatingSupply - numTokens;
        const grossSellValue = getTokenCost(newInputSupply, numTokens);
        const sellFee = grossSellValue.multipliedBy(SELL_FEE_BPS).dividedBy(10000);

        // Price impact on sell leg
        const inputSpotPrice = inputToken.reserve.currentPrice;
        const avgSellPrice = grossSellValue.dividedBy(numTokens);
        const sellPriceImpact = inputSpotPrice.minus(avgSellPrice).dividedBy(inputSpotPrice).multipliedBy(100);

        // Step 2: Buy output with USDF
        const isExempt = outputToken.mint ? isFeeExempt(outputToken.mint) : false;
        const buyFee = isExempt ? new BigNumber(0) : usdfFromSell.multipliedBy(BUY_FEE_BPS).dividedBy(10000);
        const netUsdf = usdfFromSell.minus(buyFee);
        const tokensOut = getTokensForUsdf(outputToken.reserve.circulatingSupply, netUsdf);

        // Value tokens at POST-trade spot price (your tokens are worth more after you buy!)
        const newOutputSupply = outputToken.reserve.circulatingSupply + tokensOut.toNumber();
        const postTradeOutputPrice = getSpotPrice(newOutputSupply);
        const outputUsdValue = postTradeOutputPrice.multipliedBy(tokensOut);

        // Price impact on buy leg (pre vs post trade price)
        const preTradeOutputPrice = outputToken.reserve.currentPrice;
        const buyPriceImpact = postTradeOutputPrice.minus(preTradeOutputPrice).dividedBy(preTradeOutputPrice).multipliedBy(100);

        // Combined price impact (sell slippage + buy price movement)
        const totalPriceImpact = sellPriceImpact.plus(buyPriceImpact).abs();

        const fees = [{ label: 'Flipcash (1%)', amount: sellFee }];
        if (buyFee.isGreaterThan(0)) {
          fees.push({ label: `Moonyswap (${BUY_FEE_BPS / 100}%)`, amount: buyFee });
        }

        return {
          route: 'routed' as const,
          routeLabel: `${inputToken.symbol} → USDF → ${outputToken.symbol}`,
          outputTokenAmount: tokensOut,
          outputUsdValue,
          intermediate: usdfFromSell,
          fees,
          priceImpact: totalPriceImpact,
        };
      }

      return null;
    } catch (err) {
      return null;
    }
  }, [inputToken, outputToken, inputTokenAmount]);

  // Swap input/output tokens
  const handleSwapDirection = () => {
    const temp = inputToken;
    setInputToken(outputToken || USDF_TOKEN);
    setOutputToken(temp);
    setInputUsdAmount('');
  };

  // Open Coinbase Onramp with secure session
  const proceedToCoinbase = async () => {
    setCoinbaseLoading(true);
    setPendingCoinbase(false);

    try {
      const response = await fetch('/api/coinbase-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey?.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();

      // Navigate current window to Coinbase (avoids popup issues)
      window.location.href = data.url;
    } catch (error) {
      console.error('Coinbase onramp error:', error);
      alert('Failed to open Coinbase. Please try again.');
    } finally {
      setCoinbaseLoading(false);
    }
  };

  const handleCoinbaseOnramp = () => {
    // Prompt to connect wallet first
    if (!wallet.connected) {
      setPendingCoinbase(true);
      setWalletModalVisible(true);
      return;
    }

    proceedToCoinbase();
  };

  // Auto-proceed to Coinbase after wallet connects
  useEffect(() => {
    if (pendingCoinbase && wallet.connected) {
      proceedToCoinbase();
    }
  }, [wallet.connected, pendingCoinbase]);

  // Token icon component
  const TokenIcon = ({ token, size = 'md' }: { token: SwapToken; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-5 h-5 text-xs',
      md: 'w-6 h-6 text-sm',
      lg: 'w-8 h-8 text-base',
    };
    const cls = sizeClasses[size];

    if (token.type === 'usdf') {
      return (
        <div className={`${cls} rounded-full bg-green-500 flex items-center justify-center text-white font-bold`}>
          $
        </div>
      );
    }
    if (token.icon) {
      return <img src={token.icon} alt={token.symbol} className={`${cls} rounded-full`} />;
    }
    return (
      <div className={`${cls} rounded-full bg-moony-gradient flex items-center justify-center text-[#0c0c0f] font-bold`}>
        {token.symbol.charAt(0)}
      </div>
    );
  };

  // Token selector dropdown
  const TokenSelector = ({
    selected,
    onSelect,
    show,
    setShow,
    exclude,
  }: {
    selected: SwapToken | null;
    onSelect: (token: SwapToken) => void;
    show: boolean;
    setShow: (show: boolean) => void;
    exclude?: SwapToken | null;
  }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 bg-[#2a2a30] hover:bg-[#3a3a40] pl-2 pr-3 py-2 rounded-xl transition-colors min-w-[100px]"
      >
        {selected ? (
          <>
            <TokenIcon token={selected} />
            <span className="text-white font-semibold">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-[#a0a0a8]">Select</span>
        )}
        <svg className="w-4 h-4 text-[#a0a0a8] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {show && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShow(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1f] border border-[#2a2a30] rounded-xl shadow-xl z-20 py-2 max-h-64 overflow-y-auto">
            {availableTokens
              .filter(t => !exclude || t.mint !== exclude.mint)
              .map((token) => (
                <button
                  key={token.mint || token.symbol}
                  onClick={() => {
                    onSelect(token);
                    setShow(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a2a30] transition-colors ${
                    selected?.mint === token.mint ? 'bg-[#2a2a30]' : ''
                  }`}
                >
                  <TokenIcon token={token} />
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{token.symbol}</div>
                    {token.reserve && (
                      <div className="text-[#707078] text-xs">{token.reserve.currentPriceFormatted}</div>
                    )}
                    {token.type === 'usdf' && (
                      <div className="text-[#707078] text-xs">$1.00</div>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );

  if (reservesLoading) {
    return (
      <div className="bg-[#141418] rounded-xl p-5 border border-[#2a2a30]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a1f] rounded-lg w-24" />
          <div className="h-24 bg-[#1a1a1f] rounded-xl" />
          <div className="h-24 bg-[#1a1a1f] rounded-xl" />
          <div className="h-12 bg-[#1a1a1f] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141418] rounded-xl p-5 border border-[#2a2a30]">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-moony-gradient font-semibold">Swap</h3>
      </div>

      {/* Input (You pay) - USD denominated */}
      <div className="bg-[#1a1a1f] rounded-xl p-4 mb-2">
        <div className="text-xs text-[#707078] mb-2">You pay</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center min-w-0">
            <span className="text-2xl font-bold text-[#707078] mr-1">$</span>
            <input
              type="number"
              value={inputUsdAmount}
              onChange={(e) => setInputUsdAmount(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-[#3a3a40] min-w-0"
            />
          </div>
          <TokenSelector
            selected={inputToken}
            onSelect={(t) => { setInputToken(t); setInputUsdAmount(''); }}
            show={showInputSelector}
            setShow={setShowInputSelector}
            exclude={outputToken}
          />
        </div>
        {inputTokenAmount && inputTokenAmount.isGreaterThan(0) && (
          <div className="text-sm text-[#707078] mt-2">
            {formatTokenAmount(inputTokenAmount, 2)} {inputToken.symbol}
          </div>
        )}
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center -my-4 relative z-10">
        <button
          onClick={handleSwapDirection}
          className="bg-[#1a1a1f] border-4 border-[#141418] rounded-xl p-2 hover:bg-[#2a2a30] transition-colors"
        >
          <svg className="w-5 h-5 text-[#a0a0a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output (You receive) - USD denominated */}
      <div className="bg-[#1a1a1f] rounded-xl p-4 mb-4">
        <div className="text-xs text-[#707078] mb-2">You receive</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center min-w-0">
            <span className="text-2xl font-bold text-[#707078] mr-1">$</span>
            <span className="text-2xl font-bold text-white">
              {quote ? quote.outputUsdValue.toFixed(2) : '0'}
            </span>
          </div>
          <TokenSelector
            selected={outputToken}
            onSelect={(t) => { setOutputToken(t); setInputUsdAmount(''); }}
            show={showOutputSelector}
            setShow={setShowOutputSelector}
            exclude={inputToken}
          />
        </div>
        {quote && (
          <div className="text-sm text-[#707078] mt-2">
            {formatTokenAmount(quote.outputTokenAmount, 2)} {outputToken?.symbol}
          </div>
        )}
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="bg-[#1a1a1f]/50 border border-[#2a2a30] rounded-xl p-3 mb-4 space-y-2 text-sm">
          {quote.route === 'routed' && (
            <div className="flex justify-between">
              <span className="text-[#707078]">Route</span>
              <span className="text-[#D8C5FD] font-medium">{quote.routeLabel}</span>
            </div>
          )}
          {quote.route === 'routed' && 'intermediate' in quote && (
            <div className="flex justify-between">
              <span className="text-[#707078]">Via USDF</span>
              <span className="text-[#a0a0a8]">{formatUsd(quote.intermediate)}</span>
            </div>
          )}
          {quote.fees.map((fee, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-[#707078]">{fee.label}</span>
              <span className="text-orange-400">-{formatUsd(fee.amount)}</span>
            </div>
          ))}
          {quote.priceImpact.isGreaterThan(0.5) && (
            <div className="flex justify-between">
              <span className="text-[#707078]">Price Impact</span>
              <span className={
                inputToken.type === 'usdf'
                  ? 'text-green-400' // Buying = price going up is good!
                  : quote.priceImpact.isGreaterThan(3) ? 'text-red-400' : 'text-orange-400'
              }>
                {inputToken.type === 'usdf' ? '+' : '~'}{quote.priceImpact.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Swap Button */}
      {!wallet.connected ? (
        <div>
          <button
            onClick={() => setWalletModalVisible(true)}
            className="w-full py-3.5 rounded-xl font-semibold transition-all btn-moony"
          >
            Connect Wallet
          </button>
          {/* Supported wallets */}
          <div className="mt-4 pt-4 border-t border-[#2a2a30]">
            <div className="flex items-center justify-center gap-2 text-xs text-[#707078]">
              <span>Works with</span>
              <div className="flex items-center gap-2">
                <img src="https://phantom.app/img/phantom-icon-purple.svg" alt="Phantom" className="w-4 h-4" title="Phantom" />
                <img src="https://solflare.com/favicon.ico" alt="Solflare" className="w-4 h-4" title="Solflare" />
                <svg className="w-4 h-4" viewBox="0 0 40 40" fill="none" title="Backpack">
                  <rect width="40" height="40" rx="8" fill="#e33e3f"/>
                  <path d="M12 14h16v14a2 2 0 01-2 2H14a2 2 0 01-2-2V14z" fill="white"/>
                  <path d="M14 10h12a2 2 0 012 2v2H12v-2a2 2 0 012-2z" fill="white"/>
                </svg>
              </div>
              <span>+ more</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          disabled={!quote}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
            quote
              ? 'btn-moony'
              : 'bg-[#1a1a1f] text-[#707078] cursor-not-allowed'
          }`}
        >
          {!inputToken || !outputToken
            ? 'Select tokens'
            : !quote
            ? 'Enter amount'
            : `Swap $${inputUsdAmount} of ${inputToken.symbol}`}
        </button>
      )}

      {/* Coming Soon Notice */}
      {wallet.connected && quote && (
        <p className="text-center text-xs text-orange-400 mt-3">
          Swaps coming soon
        </p>
      )}

      {/* Coinbase Onramp - Need USDC? */}
      {inputToken.type === 'usdf' && (
        <div className="mt-4 pt-4 border-t border-[#2a2a30]">
          <button
            onClick={handleCoinbaseOnramp}
            disabled={coinbaseLoading}
            className="w-full flex items-center justify-center gap-2 text-sm text-[#a0a0a8] hover:text-white transition-colors disabled:opacity-50"
          >
            {coinbaseLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 1024 1024" fill="none">
                <circle cx="512" cy="512" r="512" fill="#0052FF"/>
                <path d="M512 692c-99.4 0-180-80.6-180-180s80.6-180 180-180c89.1 0 163.1 65 177.3 150h181.7c-15.3-184.8-170-330-358.9-330-199.1 0-360 160.9-360 360s160.9 360 360 360c188.9 0 343.6-145.2 358.9-330H689.3c-14.2 85-88.2 150-177.3 150z" fill="white"/>
              </svg>
            )}
            {coinbaseLoading ? 'Opening Coinbase...' : 'Need USDC? Buy with Coinbase'}
          </button>
        </div>
      )}
    </div>
  );
}
