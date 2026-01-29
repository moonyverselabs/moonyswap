import BigNumber from 'bignumber.js';
import { QUARKS_PER_TOKEN, USDF_DECIMALS } from './constants';

// Configure BigNumber for high precision
BigNumber.config({ DECIMAL_PLACES: 40, ROUNDING_MODE: BigNumber.ROUND_DOWN });

// Curve constants (from flipcash-program/api/src/consts.rs)
// These define the exponential curve from $0.01 to $1,000,000 over 21M tokens
// R'(S) = a * b * e^(c * S)
const SCALE = new BigNumber(10).pow(18);
const CURVE_A = new BigNumber('11400230149967394933471').dividedBy(SCALE);
const CURVE_B = new BigNumber('877175273521').dividedBy(SCALE);
const CURVE_C = CURVE_B;

/**
 * Get the spot price at a given circulating supply
 * Formula: R'(S) = a * b * e^(c * S)
 * @param circulatingSupply - Number of tokens in circulation (in whole tokens)
 * @returns Price in USD (as a BigNumber)
 */
export function getSpotPrice(circulatingSupply: number): BigNumber {
  // R'(S) = a * b * e^(c * S)
  const cTimesS = CURVE_C.multipliedBy(circulatingSupply).toNumber();
  const expTerm = new BigNumber(Math.exp(cTimesS));
  return CURVE_A.multipliedBy(CURVE_B).multipliedBy(expTerm);
}

/**
 * Calculate how much USDF is needed to buy a given number of tokens
 * Formula: R(S) = (a * b / c) * (e^(c * S1) - e^(c * S0))
 * @param currentSupply - Current circulating supply (in whole tokens)
 * @param tokensToBuy - Number of tokens to buy (in whole tokens)
 * @returns Cost in USDF (as a BigNumber)
 */
export function getTokenCost(currentSupply: number, tokensToBuy: number): BigNumber {
  if (tokensToBuy === 0) return new BigNumber(0);

  const newSupply = currentSupply + tokensToBuy;

  const cTimesS0 = CURVE_C.multipliedBy(currentSupply).toNumber();
  const cTimesS1 = CURVE_C.multipliedBy(newSupply).toNumber();

  const expS0 = new BigNumber(Math.exp(cTimesS0));
  const expS1 = new BigNumber(Math.exp(cTimesS1));

  const abOverC = CURVE_A.multipliedBy(CURVE_B).dividedBy(CURVE_C);

  return abOverC.multipliedBy(expS1.minus(expS0));
}

/**
 * Calculate how many tokens you get for a given USDF amount
 * Formula: tokens = (1/c) * ln(value / (a*b/c) + e^(c*S0)) - S0
 * @param currentSupply - Current circulating supply (in whole tokens)
 * @param usdfAmount - Amount of USDF to spend
 * @returns Number of tokens received (as a BigNumber)
 */
export function getTokensForUsdf(currentSupply: number, usdfAmount: BigNumber): BigNumber {
  if (usdfAmount.isZero()) return new BigNumber(0);

  const abOverC = CURVE_A.multipliedBy(CURVE_B).dividedBy(CURVE_C);
  const cTimesS0 = CURVE_C.multipliedBy(currentSupply).toNumber();
  const expS0 = new BigNumber(Math.exp(cTimesS0));

  const term = usdfAmount.dividedBy(abOverC).plus(expS0);
  const lnTerm = new BigNumber(Math.log(term.toNumber()));

  return lnTerm.dividedBy(CURVE_C).minus(currentSupply);
}

/**
 * Calculate USDF received when selling tokens (after fee)
 * @param currentSupply - Current circulating supply (in whole tokens)
 * @param tokensToSell - Number of tokens to sell
 * @param feeBps - Fee in basis points (default 100 = 1%)
 * @returns USDF received after fee
 */
export function getSellValue(currentSupply: number, tokensToSell: number, feeBps: number = 100): BigNumber {
  const newSupply = currentSupply - tokensToSell;
  if (newSupply < 0) {
    throw new Error('Cannot sell more than circulating supply');
  }

  // Value is the integral from newSupply to currentSupply
  const grossValue = getTokenCost(newSupply, tokensToSell);

  // Apply fee
  const feeMultiplier = new BigNumber(10000 - feeBps).dividedBy(10000);
  return grossValue.multipliedBy(feeMultiplier);
}

/**
 * Format a token amount for display
 */
export function formatTokenAmount(amount: BigNumber | number, decimals: number = 4): string {
  const bn = BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount);
  return bn.toFormat(decimals);
}

/**
 * Format a USD amount for display
 */
export function formatUsd(amount: BigNumber | number): string {
  const bn = BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount);
  if (bn.isLessThan(0.01)) {
    return '$' + bn.toFormat(6);
  }
  if (bn.isLessThan(1)) {
    return '$' + bn.toFormat(4);
  }
  return '$' + bn.toFormat(3);
}

/**
 * Convert quarks (smallest unit) to whole tokens
 */
export function quarksToTokens(quarks: bigint): number {
  return Number(quarks) / QUARKS_PER_TOKEN;
}

/**
 * Convert whole tokens to quarks
 */
export function tokensToQuarks(tokens: number): bigint {
  return BigInt(Math.floor(tokens * QUARKS_PER_TOKEN));
}

/**
 * Convert USDF base units to whole USDF
 */
export function usdfBaseToWhole(baseUnits: bigint): BigNumber {
  return new BigNumber(baseUnits.toString()).dividedBy(10 ** USDF_DECIMALS);
}

/**
 * Convert whole USDF to base units
 */
export function usdfWholeToBase(whole: BigNumber): bigint {
  return BigInt(whole.multipliedBy(10 ** USDF_DECIMALS).integerValue().toString());
}

/**
 * Calculate the circulating supply from vault balances
 * Circulating = MaxSupply - VaultBalance
 */
export function calculateCirculatingSupply(vaultBalance: bigint, maxSupply: number = 21_000_000): number {
  const vaultTokens = quarksToTokens(vaultBalance);
  return maxSupply - vaultTokens;
}
