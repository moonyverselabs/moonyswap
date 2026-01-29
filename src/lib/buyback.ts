import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { FLIPCASH_PROGRAM_ID, MNY_RESERVE, USDF_MINT, FEE_TREASURY } from './constants';
import { getTokensForUsdf } from './curve';
import BigNumber from 'bignumber.js';

/**
 * Fee Buyback System
 *
 * Collected USDF fees are periodically used to buy MNY from the Moony Reserve.
 * This creates constant buy pressure on MNY as the platform grows.
 *
 * Flow:
 * 1. User buys token → 0.5% fee sent to treasury in USDF
 * 2. Treasury accumulates USDF
 * 3. When threshold reached (or manually triggered), swap USDF → MNY
 * 4. MNY sent to treasury (or burned, or distributed)
 */

export interface BuybackConfig {
  // Minimum USDF to accumulate before triggering buyback
  minBuybackAmount: number;
  // Treasury wallet that holds accumulated fees
  treasuryWallet: PublicKey;
  // Where to send purchased MNY (could be same as treasury, or a burn address)
  mnyDestination: PublicKey;
}

export const DEFAULT_BUYBACK_CONFIG: BuybackConfig = {
  minBuybackAmount: 10, // $10 minimum before buyback
  treasuryWallet: new PublicKey(FEE_TREASURY),
  mnyDestination: new PublicKey(FEE_TREASURY), // Send MNY to treasury
};

/**
 * Check the current USDF balance in the fee treasury
 */
export async function getTreasuryBalance(connection: Connection): Promise<BigNumber> {
  try {
    const treasuryUsdfAta = await getAssociatedTokenAddress(
      USDF_MINT,
      new PublicKey(FEE_TREASURY)
    );

    const balance = await connection.getTokenAccountBalance(treasuryUsdfAta);
    return new BigNumber(balance.value.uiAmount || 0);
  } catch (err) {
    console.error('Error fetching treasury balance:', err);
    return new BigNumber(0);
  }
}

/**
 * Estimate how much MNY would be received for a given USDF amount
 */
export async function estimateBuyback(
  connection: Connection,
  usdfAmount: BigNumber
): Promise<{ mnyOut: BigNumber; avgPrice: BigNumber }> {
  // Fetch current MNY reserve state
  const mnyVaultInfo = await connection.getAccountInfo(MNY_RESERVE.currencyVault);
  if (!mnyVaultInfo) {
    throw new Error('Could not fetch MNY reserve data');
  }

  const mnyVaultBalance = mnyVaultInfo.data.readBigUInt64LE(64);
  const mnyCirculatingSupply = 21_000_000 - Number(mnyVaultBalance) / 10_000_000_000;

  const mnyOut = getTokensForUsdf(mnyCirculatingSupply, usdfAmount);
  const avgPrice = usdfAmount.dividedBy(mnyOut);

  return { mnyOut, avgPrice };
}

/**
 * Build transaction to swap accumulated USDF fees for MNY
 *
 * This creates the instructions needed to:
 * 1. Call buy_tokens on the MNY reserve
 * 2. Transfer received MNY to destination
 *
 * Note: The actual Flipcash buy_tokens instruction format depends on the IDL.
 * This is a placeholder structure - adjust based on actual program interface.
 */
export async function buildBuybackTransaction(
  connection: Connection,
  payer: PublicKey,
  usdfAmount: BigNumber,
  config: BuybackConfig = DEFAULT_BUYBACK_CONFIG
): Promise<Transaction> {
  const transaction = new Transaction();

  // Get associated token accounts
  const payerUsdfAta = await getAssociatedTokenAddress(USDF_MINT, payer);
  const payerMnyAta = await getAssociatedTokenAddress(MNY_RESERVE.mint, payer);
  const destMnyAta = await getAssociatedTokenAddress(MNY_RESERVE.mint, config.mnyDestination);

  // Check if destination MNY account exists, create if not
  const destMnyInfo = await connection.getAccountInfo(destMnyAta);
  if (!destMnyInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        destMnyAta,
        config.mnyDestination,
        MNY_RESERVE.mint
      )
    );
  }

  // Build the buy_tokens instruction
  // Note: This is a simplified placeholder. The actual instruction
  // needs to match the Flipcash program's buy_tokens interface.
  const buyTokensIx = buildBuyTokensInstruction({
    payer,
    pool: MNY_RESERVE.pool,
    currencyVault: MNY_RESERVE.currencyVault,
    baseVault: MNY_RESERVE.baseVault,
    userBaseAccount: payerUsdfAta,
    userCurrencyAccount: payerMnyAta,
    amount: usdfAmount,
  });

  transaction.add(buyTokensIx);

  return transaction;
}

/**
 * Placeholder for building the actual buy_tokens instruction
 * This needs to be implemented based on the Flipcash IDL
 */
function buildBuyTokensInstruction(params: {
  payer: PublicKey;
  pool: PublicKey;
  currencyVault: PublicKey;
  baseVault: PublicKey;
  userBaseAccount: PublicKey;
  userCurrencyAccount: PublicKey;
  amount: BigNumber;
}): TransactionInstruction {
  // TODO: Implement based on Flipcash IDL
  // The instruction data format depends on the program's interface

  // Placeholder instruction structure
  const keys = [
    { pubkey: params.payer, isSigner: true, isWritable: true },
    { pubkey: params.pool, isSigner: false, isWritable: true },
    { pubkey: params.currencyVault, isSigner: false, isWritable: true },
    { pubkey: params.baseVault, isSigner: false, isWritable: true },
    { pubkey: params.userBaseAccount, isSigner: false, isWritable: true },
    { pubkey: params.userCurrencyAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  // Instruction discriminator + amount (placeholder)
  const data = Buffer.alloc(16);
  // Write instruction discriminator for buy_tokens
  // Write amount in base units

  return new TransactionInstruction({
    keys,
    programId: FLIPCASH_PROGRAM_ID,
    data,
  });
}

/**
 * Summary of buyback system status
 */
export interface BuybackStatus {
  treasuryBalanceUsdf: BigNumber;
  minBuybackAmount: number;
  readyForBuyback: boolean;
  estimatedMnyOut?: BigNumber;
}

export async function getBuybackStatus(
  connection: Connection,
  config: BuybackConfig = DEFAULT_BUYBACK_CONFIG
): Promise<BuybackStatus> {
  const treasuryBalanceUsdf = await getTreasuryBalance(connection);
  const readyForBuyback = treasuryBalanceUsdf.isGreaterThanOrEqualTo(config.minBuybackAmount);

  let estimatedMnyOut: BigNumber | undefined;
  if (readyForBuyback) {
    try {
      const estimate = await estimateBuyback(connection, treasuryBalanceUsdf);
      estimatedMnyOut = estimate.mnyOut;
    } catch (err) {
      // MNY reserve might not be deployed yet
    }
  }

  return {
    treasuryBalanceUsdf,
    minBuybackAmount: config.minBuybackAmount,
    readyForBuyback,
    estimatedMnyOut,
  };
}
