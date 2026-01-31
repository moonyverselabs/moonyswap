import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Moonyswap - App Ecosystem';
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
            top: '50px',
            left: '150px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(216, 197, 253, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            right: '200px',
            width: '400px',
            height: '400px',
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
            App Ecosystem
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#707078',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Discover apps, games, and platforms powered by programmable currencies
          </div>
        </div>

        {/* App icons decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            display: 'flex',
            gap: '16px',
          }}
        >
          {[
            ['#7C3AED', '#EC4899'],
            ['#10B981', '#06B6D4'],
            ['#F59E0B', '#EF4444'],
            ['#3B82F6', '#6366F1'],
            ['#EC4899', '#F43F5E'],
          ].map((colors, i) => (
            <div
              key={i}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                border: '2px solid #2a2a30',
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
