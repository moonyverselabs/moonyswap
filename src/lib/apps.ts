export interface App {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon?: string;
  url?: string;
  category: 'game' | 'platform' | 'tool' | 'social' | 'marketplace';
  status: 'live' | 'coming-soon' | 'example';
  supportedCurrencies?: string[]; // mint addresses
  screenshots?: string[];
}

export const CATEGORY_LABELS: Record<App['category'], string> = {
  game: 'Game',
  platform: 'Platform',
  tool: 'Tool',
  social: 'Social',
  marketplace: 'Marketplace',
};

export const CATEGORY_COLORS: Record<App['category'], string> = {
  game: 'bg-purple-500/20 text-purple-400',
  platform: 'bg-blue-500/20 text-blue-400',
  tool: 'bg-emerald-500/20 text-emerald-400',
  social: 'bg-pink-500/20 text-pink-400',
  marketplace: 'bg-amber-500/20 text-amber-400',
};

// Example apps to demonstrate what the ecosystem could look like
export const EXAMPLE_APPS: App[] = [
  {
    id: 'example-game',
    name: 'Lunar Quest',
    description: 'A space exploration RPG where players earn and spend in-game currency.',
    longDescription: 'Lunar Quest is an immersive space exploration game where players can earn currency by completing missions, trading resources, and building their fleet. The in-game economy is powered by Flipcash, enabling real value exchange between players.',
    category: 'game',
    status: 'example',
  },
  {
    id: 'example-marketplace',
    name: 'ArtVault',
    description: 'A digital art marketplace with creator-first economics.',
    longDescription: 'ArtVault enables artists to sell digital artwork using programmable currencies. Creators set their own pricing curves, and collectors can trade pieces with guaranteed liquidity.',
    category: 'marketplace',
    status: 'example',
  },
  {
    id: 'example-platform',
    name: 'StreamPay',
    description: 'Real-time payment streaming for content creators and subscribers.',
    longDescription: 'StreamPay allows fans to stream micropayments to their favorite creators in real-time. Built on Flipcash Protocol, payments flow continuously as content is consumed.',
    category: 'platform',
    status: 'example',
  },
];

export function getAppById(id: string): App | undefined {
  return EXAMPLE_APPS.find(app => app.id === id);
}

export function getAppsByCategory(category: App['category']): App[] {
  return EXAMPLE_APPS.filter(app => app.category === category);
}
