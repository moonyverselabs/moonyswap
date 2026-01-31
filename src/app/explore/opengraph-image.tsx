import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Moonyswap - Explore Currencies';
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
            top: '-50px',
            right: '100px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(216, 197, 253, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '100px',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(255, 242, 217, 0.15) 0%, transparent 70%)',
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
              fontSize: 28,
              color: '#a0a0a8',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            Moonyswap
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(to right, #D8C5FD, #FFF2D9)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 24,
            }}
          >
            Explore Currencies
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#707078',
            }}
          >
            Discover programmable currencies backed by Proof of Capital
          </div>
        </div>

        {/* Currency circles decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            display: 'flex',
            gap: '-20px',
          }}
        >
          {['#7C3AED', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'].map((color, i) => (
            <div
              key={i}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}, ${color}99)`,
                border: '3px solid #1a1a1f',
                marginLeft: i > 0 ? '-20px' : '0',
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
