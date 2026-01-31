import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Moonyswap - Decentralized Currency Exchange';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0c0c0f 0%, #1a1a1f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(216, 197, 253, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255, 242, 217, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              background: 'linear-gradient(to right, #D8C5FD, #FFF2D9)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 16,
            }}
          >
            Moonyswap
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#a0a0a8',
              marginBottom: 40,
            }}
          >
            Decentralized Currency Exchange
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#707078',
            }}
          >
            Trade programmable currencies with guaranteed liquidity
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
