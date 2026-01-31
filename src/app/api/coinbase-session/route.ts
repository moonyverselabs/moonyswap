import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import crypto from 'crypto';

const COINBASE_API_KEY = process.env.COINBASE_API_KEY || '';
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET || '';
const COINBASE_APP_ID = process.env.NEXT_PUBLIC_COINBASE_APP_ID || '';

// Handle PEM key - Vercel may escape newlines as \n
function formatPemKey(key: string): string {
  return key.replace(/\\n/g, '\n').trim();
}

// Convert EC PRIVATE KEY to PKCS8 format for jose
function convertToPKCS8(ecPrivateKey: string): string {
  // If already PKCS8, return as-is
  if (ecPrivateKey.includes('BEGIN PRIVATE KEY')) {
    return ecPrivateKey;
  }

  // For SEC1 EC keys, we need to convert
  // Extract the base64 content
  const lines = ecPrivateKey.split('\n');
  const base64Content = lines
    .filter(line => !line.includes('-----'))
    .join('');

  // Create PKCS8 wrapper for EC key (P-256/secp256r1)
  // PKCS8 header for EC P-256: 302e0201010420 + key + a00706052b8104000a (for secp256k1)
  // or a00a06082a8648ce3d030107 (for P-256/prime256v1)

  // Actually, let's try a different approach - use the key directly with crypto
  return ecPrivateKey;
}

async function generateJWT(): Promise<string> {
  const formattedKey = formatPemKey(COINBASE_API_SECRET);

  // Try to import as EC key directly
  let privateKey;
  try {
    // jose needs PKCS8 format, so we'll use Node crypto to sign instead
    privateKey = crypto.createPrivateKey(formattedKey);
  } catch (e) {
    throw new Error(`Failed to parse private key: ${e}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const header = {
    alg: 'ES256',
    typ: 'JWT',
    kid: COINBASE_API_KEY,
    nonce: nonce,
  };

  const payload = {
    iss: 'cdp',
    sub: COINBASE_API_KEY,
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120,
    uri: 'POST api.developer.coinbase.com/onramp/v1/token',
  };

  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const message = `${encodedHeader}.${encodedPayload}`;

  // Sign with ES256 (ECDSA with P-256 and SHA-256)
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  const derSignature = sign.sign(privateKey);

  // Convert DER signature to raw R||S format for JWT
  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  const rStart = 4;
  const rLength = derSignature[3];
  const sStart = rStart + rLength + 2;
  const sLength = derSignature[sStart - 1];

  let r = derSignature.subarray(rStart, rStart + rLength);
  let s = derSignature.subarray(sStart, sStart + sLength);

  // Remove leading zeros if present (DER uses minimal encoding)
  if (r[0] === 0 && r.length > 32) r = r.subarray(1);
  if (s[0] === 0 && s.length > 32) s = s.subarray(1);

  // Pad to 32 bytes if needed
  const rPadded = Buffer.alloc(32);
  const sPadded = Buffer.alloc(32);
  r.copy(rPadded, 32 - r.length);
  s.copy(sPadded, 32 - s.length);

  const signature = Buffer.concat([rPadded, sPadded]).toString('base64url');

  return `${message}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!COINBASE_API_KEY || !COINBASE_API_SECRET || !COINBASE_APP_ID) {
      return NextResponse.json(
        { error: 'Coinbase credentials not configured' },
        { status: 500 }
      );
    }

    // Generate JWT
    let jwt: string;
    try {
      jwt = await generateJWT();
    } catch (e) {
      return NextResponse.json(
        { error: 'JWT generation failed', details: String(e) },
        { status: 500 }
      );
    }

    // Request session token from Coinbase
    // Using 'addresses' format as per demo app
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        addresses: walletAddress ? [{
          address: walletAddress,
          blockchains: ['solana'],
        }] : [],
        assets: ['USDC'],
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

    // Debug: log what Coinbase returns
    console.log('Coinbase response:', JSON.stringify(data));

    // The token might be in different fields depending on API version
    const token = data.token || data.session_token || data.sessionToken;

    if (!token) {
      return NextResponse.json(
        { error: 'No token in response', data },
        { status: 500 }
      );
    }

    // Return the onramp URL with session token
    const onrampUrl = `https://pay.coinbase.com/buy/select-asset?sessionToken=${token}`;

    return NextResponse.json({ url: onrampUrl, debug: { responseKeys: Object.keys(data) } });
  } catch (error) {
    console.error('Error creating Coinbase session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
