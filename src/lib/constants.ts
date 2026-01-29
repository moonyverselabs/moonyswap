import { PublicKey } from '@solana/web3.js';

// Flipcash Program
export const FLIPCASH_PROGRAM_ID = new PublicKey('ccJYP5gjZqcEHaphcxAZvkxCrnTVfYMjyhSYkpQtf8Z');

// PDA Seeds
export const CURRENCY_SEED = 'currency';
export const POOL_SEED = 'pool';
export const TREASURY_SEED = 'treasury';

// Token decimals
export const TOKEN_DECIMALS = 10;
export const USDF_DECIMALS = 6;
export const QUARKS_PER_TOKEN = 10_000_000_000; // 10^10

// Curve constants (from flipcash-program)
// These define the exponential curve from $0.01 to $1,000,000 over 21M tokens
export const CURVE_A = BigInt('11400230149967394933471');
export const CURVE_B = BigInt('877175273521');
export const CURVE_C = CURVE_B;

// Discrete pricing step size (100 tokens)
export const DISCRETE_PRICING_STEP_SIZE = 100;

// Max supply
export const MAX_TOKEN_SUPPLY = 21_000_000;

// Example tokens (for testing)
export const KNOWN_TOKENS: Record<string, {
  name: string;
  symbol: string;
  mint: PublicKey;
  baseMint: PublicKey;
  pool: PublicKey;
  currencyVault: PublicKey;
  baseVault: PublicKey;
  icon: string;
  metadataUri: string;
}> = {
  // Jeffy (JFY) - deployed on mainnet via Flipcash
  jeffy: {
    name: 'Jeffy',
    symbol: 'JFY',
    mint: new PublicKey('54ggcQ23uen5b9QXMAns99MQNTKn7iyzq4wvCW6e8r25'),
    baseMint: new PublicKey('5AMAA9JV9H97YYVxx8F6FsCMmTwXSuTTQneiup4RYAUQ'), // USDF
    pool: new PublicKey('EEMP4DQcXzw56avKxPhmh2Kjdxxvwavt5ecLUKcxVeTW'),
    currencyVault: new PublicKey('BMYftxDcbLDTzRCkLmQ9amwNgqsZ74A1wsd1gURum3Ep'),
    baseVault: new PublicKey('3QEYi2emN2ggYGG66RYdgDhNnumXTuQec4Ar6o5qpb6R'),
    icon: 'https://flipcash-currency-assets.s3.us-east-1.amazonaws.com/54ggcQ23uen5b9QXMAns99MQNTKn7iyzq4wvCW6e8r25/icon-large.png',
    metadataUri: 'https://currency.flipcash.com/54ggcQ23uen5b9QXMAns99MQNTKn7iyzq4wvCW6e8r25/metadata.json',
  },
};

// Flipcash protocol sell fee (1% = 100 basis points)
export const SELL_FEE_BPS = 100;

// Frontend buy fee (0.33% = 33 basis points)
// Note: MNY purchases are exempt - fees go to buying MNY, so taxing MNY buys would be circular
export const BUY_FEE_BPS = 33;

// Check if a mint is exempt from buy fees (MNY is exempt)
export function isFeeExempt(mint: PublicKey | string): boolean {
  const mintStr = typeof mint === 'string' ? mint : mint.toString();
  return mintStr === MNY_RESERVE.mint.toString();
}

// Fee treasury wallet - collects USDF fees before MNY buyback
// TODO: Replace with actual treasury wallet address
export const FEE_TREASURY = '11111111111111111111111111111111'; // System program as placeholder

// Moony (MNY) Reserve - for fee buybacks
// TODO: Replace placeholder addresses when MNY reserve is deployed
export const MNY_RESERVE = {
  mint: new PublicKey('mny8s3Cx1E2b3kSU4dLGfsm7nnkA1mghGmxHPBVPNVR'),
  pool: new PublicKey('11111111111111111111111111111111'), // Placeholder - add real address when deployed
  currencyVault: new PublicKey('11111111111111111111111111111111'), // Placeholder
  baseVault: new PublicKey('11111111111111111111111111111111'), // Placeholder
};

// USDF token
export const USDF_MINT = new PublicKey('5AMAA9JV9H97YYVxx8F6FsCMmTwXSuTTQneiup4RYAUQ');

// Mock Moony token for UI preview (uses JFY data with MNY branding)
export const MOCK_MNY = {
  enabled: true, // Set to false to disable mock
  mockMint: 'MOCK_MNY_PREVIEW_000000000000000000000000', // Fake mint for routing
  realMint: '54ggcQ23uen5b9QXMAns99MQNTKn7iyzq4wvCW6e8r25', // JFY mint (data source)
  name: 'Moony',
  symbol: 'MNY',
  icon: '/moony.png',
  isTestVersion: true,
  testLabel: 'Preview · Using JFY test data',
};
