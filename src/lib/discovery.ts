import { Connection, PublicKey } from '@solana/web3.js';
import { FLIPCASH_PROGRAM_ID } from './constants';

// LiquidityPool account layout (from flipcash-program)
// Discriminator: 8 bytes
// authority: Pubkey (32)
// currency: Pubkey (32) - the base mint (USDF)
// mint_a: Pubkey (32) - the token mint
// mint_b: Pubkey (32) - USDF mint
// vault_a: Pubkey (32) - token vault
// vault_b: Pubkey (32) - USDF vault
// fees_accumulated: u64 (8)
// sell_fee: u16 (2)
// bump: u8 (1)
// vault_a_bump: u8 (1)
// vault_b_bump: u8 (1)

const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;

// Pool account discriminator (first 8 bytes) - this is the Anchor discriminator for "LiquidityPool"
// We'll identify pools by their size and structure
const POOL_ACCOUNT_SIZE = 216;

export interface DiscoveredPool {
  address: PublicKey;
  authority: PublicKey;
  currencyMint: PublicKey; // The token (e.g., JFY, MNY)
  baseMint: PublicKey; // USDF
  currencyVault: PublicKey; // Token vault
  baseVault: PublicKey; // USDF vault
  sellFeeBps: number;
}

/**
 * Parse a LiquidityPool account from raw data
 */
function parsePoolAccount(address: PublicKey, data: Buffer): DiscoveredPool | null {
  try {
    if (data.length < POOL_ACCOUNT_SIZE) {
      return null;
    }

    let offset = DISCRIMINATOR_SIZE;

    const authority = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    const currency = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    const mintA = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    const mintB = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    const vaultA = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    const vaultB = new PublicKey(data.subarray(offset, offset + PUBKEY_SIZE));
    offset += PUBKEY_SIZE;

    // Skip fees_accumulated (8 bytes)
    offset += 8;

    const sellFee = data.readUInt16LE(offset);

    return {
      address,
      authority,
      currencyMint: mintA,
      baseMint: mintB,
      currencyVault: vaultA,
      baseVault: vaultB,
      sellFeeBps: sellFee,
    };
  } catch (err) {
    console.error('Error parsing pool account:', err);
    return null;
  }
}

/**
 * Discover all LiquidityPool accounts from the Flipcash program
 */
export async function discoverAllPools(connection: Connection): Promise<DiscoveredPool[]> {
  try {
    // Fetch all accounts owned by the Flipcash program
    const accounts = await connection.getProgramAccounts(FLIPCASH_PROGRAM_ID, {
      filters: [
        {
          dataSize: POOL_ACCOUNT_SIZE, // Filter by exact account size
        },
      ],
    });

    const pools: DiscoveredPool[] = [];

    for (const { pubkey, account } of accounts) {
      const parsed = parsePoolAccount(pubkey, account.data);
      if (parsed) {
        pools.push(parsed);
      }
    }

    return pools;
  } catch (err) {
    console.error('Error discovering pools:', err);
    return [];
  }
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  icon: string;
  description?: string;
}

/**
 * Fetch token metadata from Helius
 */
export async function fetchTokenMetadata(
  mintAddresses: string[],
  heliusApiKey: string
): Promise<Record<string, TokenMetadata>> {
  if (mintAddresses.length === 0) return {};

  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${heliusApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: mintAddresses }),
      }
    );

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    const result: Record<string, TokenMetadata> = {};

    for (const item of data) {
      const mint = item.account;
      const metadata = item.onChainMetadata?.metadata?.data;

      if (metadata) {
        // Fetch the off-chain metadata for the icon
        let icon = '';
        let description = '';

        if (metadata.uri) {
          try {
            const metadataResponse = await fetch(metadata.uri);
            if (metadataResponse.ok) {
              const offChainData = await metadataResponse.json();
              icon = offChainData.image || '';
              description = offChainData.description || '';
            }
          } catch {
            // Ignore fetch errors for off-chain metadata
          }
        }

        result[mint] = {
          name: metadata.name || 'Unknown',
          symbol: metadata.symbol || '???',
          icon,
          description,
        };
      }
    }

    return result;
  } catch (err) {
    console.error('Error fetching token metadata:', err);
    return {};
  }
}
