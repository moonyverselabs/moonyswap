import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY || '';
const COINBASE_APP_ID = process.env.NEXT_PUBLIC_COINBASE_APP_ID || '';

// Handle PEM key - Vercel may escape newlines as \n or strip them
function formatPemKey(key: string): string {
  // If key contains literal \n, replace with actual newlines
  let formatted = key.replace(/\\n/g, '\n');

  // If the key is all on one line (no newlines), try to reconstruct it
  if (!formatted.includes('\n') && formatted.includes('-----BEGIN')) {
    // Extract the base64 content between BEGIN and END
    const match = formatted.match(/-----BEGIN [^-]+-----(.+)-----END [^-]+-----/);
    if (match) {
      const header = formatted.match(/-----BEGIN [^-]+-----/)?.[0] || '';
      const footer = formatted.match(/-----END [^-]+-----/)?.[0] || '';
      const base64 = match[1];
      // Split base64 into 64-char lines
      const lines = base64.match(/.{1,64}/g) || [];
      formatted = `${header}\n${lines.join('\n')}\n${footer}`;
    }
  }

  return formatted;
}

const COINBASE_API_SECRET = formatPemKey(process.env.COINBASE_API_SECRET || '');

// Generate JWT for Coinbase API authentication
function generateJWT(): string {
  const header = {
    alg: 'ES256',
    kid: COINBASE_API_KEY,
    typ: 'JWT',
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'cdp',
    nbf: now,
    exp: now + 120, // 2 minutes
    sub: COINBASE_API_KEY,
    aud: ['cdp_service'],
    uri: 'POST api.developer.coinbase.com/onramp/v1/token',
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${base64Header}.${base64Payload}`;

  // Parse the PEM private key and sign
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  const signature = sign.sign(COINBASE_API_SECRET, 'base64url');

  return `${message}.${signature}`;
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

    let jwt: string;
    try {
      jwt = generateJWT();
    } catch (jwtError) {
      console.error('JWT generation failed:', jwtError);
      return NextResponse.json(
        { error: 'Failed to generate authentication token' },
        { status: 500 }
      );
    }

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
        // Lock to USDC on Solana only
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
