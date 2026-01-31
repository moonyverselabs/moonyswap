import { NextRequest, NextResponse } from 'next/server';
import { generateJwt } from '@coinbase/cdp-sdk/auth';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY || '';
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET || '';
const COINBASE_APP_ID = process.env.NEXT_PUBLIC_COINBASE_APP_ID || '';

// Handle PEM key - Vercel may escape newlines as \n
function formatPemKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!COINBASE_API_KEY || !COINBASE_API_SECRET || !COINBASE_APP_ID) {
      console.error('Missing credentials:', {
        hasKey: !!COINBASE_API_KEY,
        hasSecret: !!COINBASE_API_SECRET,
        hasAppId: !!COINBASE_APP_ID,
      });
      return NextResponse.json(
        { error: 'Coinbase credentials not configured' },
        { status: 500 }
      );
    }

    // Generate JWT using the CDP SDK
    const jwt = await generateJwt({
      apiKeyId: COINBASE_API_KEY,
      apiKeySecret: formatPemKey(COINBASE_API_SECRET),
      requestMethod: 'POST',
      requestHost: 'api.developer.coinbase.com',
      requestPath: '/onramp/v1/token',
      expiresIn: 120,
    });

    // Request session token from Coinbase
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        destination_wallets: walletAddress ? [{
          address: walletAddress,
          assets: ['USDC'],
          supported_networks: ['solana'],
        }] : [],
        assets: ['USDC'],
        default_asset: 'USDC',
        default_network: 'solana',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coinbase API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Coinbase API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the onramp URL with session token
    const onrampUrl = `https://pay.coinbase.com/buy/select-asset?sessionToken=${data.token}&appId=${COINBASE_APP_ID}`;

    return NextResponse.json({ url: onrampUrl });
  } catch (error) {
    console.error('Error creating Coinbase session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
