// Mock tokens for UI preview
// All mock tokens use JFY's real on-chain data with different branding

export interface MockToken {
  mint: string;
  name: string;
  symbol: string;
  icon: string;
}

// First 8 mock tokens (after MNY and JFY)
export const MOCK_TOKENS: MockToken[] = [
  { mint: 'MOCK_VOLT_000000000000000000000000000001', name: 'Voltage', symbol: 'VOLT', icon: '/tokens/volt.svg' },
  { mint: 'MOCK_STAR_000000000000000000000000000002', name: 'Starlight', symbol: 'STAR', icon: '/tokens/star.svg' },
  { mint: 'MOCK_NEON_000000000000000000000000000003', name: 'Neon', symbol: 'NEON', icon: '/tokens/neon.svg' },
  { mint: 'MOCK_BLZE_000000000000000000000000000004', name: 'Blaze', symbol: 'BLZE', icon: '/tokens/blze.svg' },
  { mint: 'MOCK_ECHO_000000000000000000000000000005', name: 'Echo', symbol: 'ECHO', icon: '/tokens/echo.svg' },
  { mint: 'MOCK_NOVA_000000000000000000000000000006', name: 'Nova', symbol: 'NOVA', icon: '/tokens/nova.svg' },
  { mint: 'MOCK_FLUX_000000000000000000000000000007', name: 'Flux', symbol: 'FLUX', icon: '/tokens/flux.svg' },
  { mint: 'MOCK_WAVE_000000000000000000000000000008', name: 'Wave', symbol: 'WAVE', icon: '/tokens/wave.svg' },
];

// Extended tokens with custom icons (24 tokens)
const additionalNames: [string, string][] = [
  ['Cosmic', 'COSM'], ['Pulse', 'PULS'], ['Drift', 'DRFT'], ['Spark', 'SPRK'],
  ['Vortex', 'VRTX'], ['Zenith', 'ZNTH'], ['Prism', 'PRSM'], ['Apex', 'APEX'],
  ['Orbit', 'ORBT'], ['Cipher', 'CPHR'], ['Quantum', 'QNTM'], ['Nebula', 'NEBL'],
  ['Radiant', 'RDNT'], ['Phantom', 'PHTM'], ['Aurora', 'AURA'], ['Crystal', 'CRYS'],
  ['Shadow', 'SHDW'], ['Thunder', 'THDR'], ['Fusion', 'FUSN'], ['Phoenix', 'PHNX'],
  ['Horizon', 'HRZN'], ['Ember', 'EMBR'], ['Cascade', 'CSCD'],
];

export const EXTENDED_MOCK_TOKENS: MockToken[] = additionalNames.map(([name, symbol], index) => ({
  mint: `MOCK_${symbol.padEnd(4, '0')}_${String(index + 10).padStart(26, '0')}`,
  name,
  symbol,
  icon: `/tokens/${symbol.toLowerCase()}.svg`,
}));

// Check if a mint is a mock token
export function isMockToken(mint: string): boolean {
  return mint.startsWith('MOCK_');
}

// Unique gradient colors for mock tokens based on symbol
const MOCK_GRADIENTS: Record<string, [string, string]> = {
  // Primary 8
  VOLT: ['#7C3AED', '#EC4899'], // violet to pink
  STAR: ['#F59E0B', '#EF4444'], // amber to red
  NEON: ['#10B981', '#06B6D4'], // emerald to cyan
  BLZE: ['#EF4444', '#F97316'], // red to orange
  ECHO: ['#6366F1', '#8B5CF6'], // indigo to violet
  NOVA: ['#EC4899', '#F43F5E'], // pink to rose
  FLUX: ['#14B8A6', '#22D3EE'], // teal to cyan
  WAVE: ['#3B82F6', '#6366F1'], // blue to indigo
  // Extended 24
  COSM: ['#8B5CF6', '#D946EF'], PULS: ['#F43F5E', '#FB7185'],
  DRFT: ['#06B6D4', '#22D3EE'], SPRK: ['#FBBF24', '#F59E0B'],
  VRTX: ['#7C3AED', '#4F46E5'], ZNTH: ['#0EA5E9', '#38BDF8'],
  PRSM: ['#D946EF', '#F472B6'], APEX: ['#DC2626', '#EF4444'],
  ORBT: ['#4F46E5', '#7C3AED'], CPHR: ['#059669', '#10B981'],
  QNTM: ['#7C3AED', '#A78BFA'], NEBL: ['#6366F1', '#818CF8'],
  RDNT: ['#F59E0B', '#FCD34D'], PHTM: ['#374151', '#6B7280'],
  AURA: ['#22C55E', '#4ADE80'], CRYS: ['#06B6D4', '#67E8F9'],
  SHDW: ['#1F2937', '#4B5563'], THDR: ['#FBBF24', '#F97316'],
  FUSN: ['#DC2626', '#F97316'], PHNX: ['#EA580C', '#F59E0B'],
  HRZN: ['#F97316', '#FBBF24'],
  EMBR: ['#B91C1C', '#DC2626'], CSCD: ['#0D9488', '#14B8A6'],
};

// Generate a gradient style for a mock token
export function getMockGradient(symbol: string): string {
  const colors = MOCK_GRADIENTS[symbol];
  if (colors) {
    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  }
  // Fallback: generate from symbol hash
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
}
