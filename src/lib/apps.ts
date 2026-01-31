export interface App {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon?: string;
  url?: string;
  category: 'game' | 'platform' | 'tool' | 'social' | 'marketplace';
  status: 'live' | 'coming-soon' | 'example';
  featured?: boolean;
  appStoreUrl?: string;
  playStoreUrl?: string;
  supportedCurrencies?: string[]; // mint addresses
  screenshots?: string[];
  interest?: number; // community interest/vote count
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
  marketplace: 'bg-[#FFF2D9]/20 text-[#FFF2D9]',
};

// Featured app
export const FLIPCASH_APP: App = {
  id: 'flipcash',
  name: 'Flipcash',
  description: 'The mobile payments app for programmable currencies. Send, receive, and manage all your Flipcash currencies in one place.',
  longDescription: 'Flipcash is your gateway to the programmable currency ecosystem. Send and receive instant payments, swap between currencies, and access every app and game built on the Flipcash Protocol. Available on iOS and Android.',
  icon: '/flipcash.jpg',
  url: 'https://www.flipcash.com',
  category: 'platform',
  status: 'live',
  featured: true,
  appStoreUrl: 'https://apps.apple.com/app/flipcash/id6504628921',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.flipcash',
};

// Example apps to demonstrate what the ecosystem could look like
export const EXAMPLE_APPS: App[] = [
  FLIPCASH_APP,

  // Games (6)
  {
    id: 'lunar-quest',
    name: 'Lunar Quest',
    description: 'A space exploration RPG where players earn and spend in-game currency.',
    longDescription: 'Lunar Quest is an immersive space exploration game where players can earn currency by completing missions, trading resources, and building their fleet.',
    icon: '/apps/lunar-quest.svg',
    category: 'game',
    status: 'example',
    interest: 47,
  },
  {
    id: 'pixel-kingdoms',
    name: 'Pixel Kingdoms',
    description: 'Build and manage your medieval kingdom with a player-driven economy.',
    longDescription: 'Pixel Kingdoms lets you construct castles, train armies, and trade resources with other players using real programmable currencies.',
    icon: '/apps/pixel-kingdoms.svg',
    category: 'game',
    status: 'example',
    interest: 124,
  },
  {
    id: 'neon-racers',
    name: 'Neon Racers',
    description: 'High-speed racing with upgradeable vehicles and prize pools.',
    longDescription: 'Compete in futuristic races, upgrade your vehicles, and win currency prizes in tournaments.',
    icon: '/apps/neon-racers.svg',
    category: 'game',
    status: 'example',
    interest: 89,
  },
  {
    id: 'dungeon-loot',
    name: 'Dungeon Loot',
    description: 'Roguelike dungeon crawler with tradeable loot and rewards.',
    longDescription: 'Explore procedurally generated dungeons, collect rare items, and trade your loot with other players.',
    icon: '/apps/dungeon-loot.svg',
    category: 'game',
    status: 'example',
    interest: 156,
  },
  {
    id: 'card-clash',
    name: 'Card Clash',
    description: 'Strategic card game with collectible decks and tournaments.',
    longDescription: 'Build your deck, compete in ranked matches, and earn rewards in this strategic card battler.',
    icon: '/apps/card-clash.svg',
    category: 'game',
    status: 'example',
    interest: 203,
  },
  {
    id: 'farm-fortune',
    name: 'Farm Fortune',
    description: 'Farming simulator with crop trading and seasonal markets.',
    longDescription: 'Grow crops, raise animals, and sell your harvest in a dynamic marketplace driven by supply and demand.',
    icon: '/apps/farm-fortune.svg',
    category: 'game',
    status: 'example',
    interest: 67,
  },

  // Platforms (6)
  {
    id: 'streampay',
    name: 'StreamPay',
    description: 'Real-time payment streaming for content creators.',
    longDescription: 'StreamPay allows fans to stream micropayments to their favorite creators in real-time as content is consumed.',
    icon: '/apps/streampay.svg',
    category: 'platform',
    status: 'example',
    interest: 312,
  },
  {
    id: 'creator-hub',
    name: 'Creator Hub',
    description: 'All-in-one platform for creators to monetize their content.',
    longDescription: 'Manage subscriptions, sell digital products, and receive tips from your audience.',
    icon: '/apps/creator-hub.svg',
    category: 'platform',
    status: 'example',
    interest: 178,
  },
  {
    id: 'learn-earn',
    name: 'LearnEarn',
    description: 'Educational platform where students earn while they learn.',
    longDescription: 'Complete courses, pass quizzes, and earn currency rewards for your educational achievements.',
    icon: '/apps/learn-earn.svg',
    category: 'platform',
    status: 'example',
    interest: 94,
  },
  {
    id: 'gig-flow',
    name: 'GigFlow',
    description: 'Freelance marketplace with instant payments.',
    longDescription: 'Find work, complete tasks, and get paid instantly without waiting for traditional payment processing.',
    icon: '/apps/gig-flow.svg',
    category: 'platform',
    status: 'example',
    interest: 267,
  },
  {
    id: 'event-pass',
    name: 'EventPass',
    description: 'Ticketing platform for events with transferable passes.',
    longDescription: 'Buy, sell, and transfer event tickets securely with built-in fraud protection.',
    icon: '/apps/event-pass.svg',
    category: 'platform',
    status: 'example',
    interest: 143,
  },
  {
    id: 'tip-jar',
    name: 'TipJar',
    description: 'Simple tipping for any website or content.',
    longDescription: 'Add a tip button to any page and let your audience support you with micropayments.',
    icon: '/apps/tip-jar.svg',
    category: 'platform',
    status: 'example',
    interest: 231,
  },

  // Marketplaces (6)
  {
    id: 'art-vault',
    name: 'ArtVault',
    description: 'Digital art marketplace with creator-first economics.',
    longDescription: 'ArtVault enables artists to sell digital artwork using programmable currencies with guaranteed liquidity.',
    icon: '/apps/art-vault.svg',
    category: 'marketplace',
    status: 'example',
    interest: 189,
  },
  {
    id: 'beat-market',
    name: 'BeatMarket',
    description: 'Buy and sell music beats and samples.',
    longDescription: 'Producers can list their beats, and artists can purchase licenses instantly.',
    icon: '/apps/beat-market.svg',
    category: 'marketplace',
    status: 'example',
    interest: 156,
  },
  {
    id: 'template-store',
    name: 'TemplateStore',
    description: 'Marketplace for design templates and assets.',
    longDescription: 'Find website templates, UI kits, and design resources from creators worldwide.',
    icon: '/apps/template-store.svg',
    category: 'marketplace',
    status: 'example',
    interest: 78,
  },
  {
    id: 'code-bazaar',
    name: 'CodeBazaar',
    description: 'Buy and sell code snippets and components.',
    longDescription: 'Developers can monetize their reusable code and find solutions to common problems.',
    icon: '/apps/code-bazaar.svg',
    category: 'marketplace',
    status: 'example',
    interest: 134,
  },
  {
    id: 'model-market',
    name: 'ModelMarket',
    description: '3D models and assets for games and apps.',
    longDescription: 'Browse thousands of 3D models, textures, and animations for your creative projects.',
    icon: '/apps/model-market.svg',
    category: 'marketplace',
    status: 'example',
    interest: 102,
  },
  {
    id: 'font-foundry',
    name: 'FontFoundry',
    description: 'Independent fonts from type designers.',
    longDescription: 'Discover unique typefaces and support independent font creators directly.',
    icon: '/apps/font-foundry.svg',
    category: 'marketplace',
    status: 'example',
    interest: 54,
  },

  // Tools (6)
  {
    id: 'pay-link',
    name: 'PayLink',
    description: 'Create payment links and invoices instantly.',
    longDescription: 'Generate shareable payment links for any amount and track payments in real-time.',
    icon: '/apps/pay-link.svg',
    category: 'tool',
    status: 'example',
    interest: 198,
  },
  {
    id: 'split-it',
    name: 'SplitIt',
    description: 'Split bills and expenses with friends.',
    longDescription: 'Easily divide costs among groups and settle up with instant transfers.',
    icon: '/apps/split-it.svg',
    category: 'tool',
    status: 'example',
    interest: 287,
  },
  {
    id: 'budget-buddy',
    name: 'BudgetBuddy',
    description: 'Track spending and manage your currencies.',
    longDescription: 'Monitor your balances, set budgets, and get insights into your spending habits.',
    icon: '/apps/budget-buddy.svg',
    category: 'tool',
    status: 'example',
    interest: 112,
  },
  {
    id: 'recurring-pay',
    name: 'RecurringPay',
    description: 'Set up recurring payments and subscriptions.',
    longDescription: 'Automate regular payments to services, creators, or savings goals.',
    icon: '/apps/recurring-pay.svg',
    category: 'tool',
    status: 'example',
    interest: 165,
  },
  {
    id: 'merchant-pos',
    name: 'MerchantPOS',
    description: 'Point of sale for accepting currency payments.',
    longDescription: 'Turn any device into a payment terminal for your business.',
    icon: '/apps/merchant-pos.svg',
    category: 'tool',
    status: 'example',
    interest: 89,
  },
  {
    id: 'tax-helper',
    name: 'TaxHelper',
    description: 'Track transactions for tax reporting.',
    longDescription: 'Export transaction history and generate reports for tax compliance.',
    icon: '/apps/tax-helper.svg',
    category: 'tool',
    status: 'example',
    interest: 76,
  },

  // Social (6)
  {
    id: 'chat-pay',
    name: 'ChatPay',
    description: 'Send payments in any chat conversation.',
    longDescription: 'Integrate payments into your favorite messaging apps with simple commands.',
    icon: '/apps/chat-pay.svg',
    category: 'social',
    status: 'example',
    interest: 245,
  },
  {
    id: 'group-fund',
    name: 'GroupFund',
    description: 'Crowdfund goals with friends and communities.',
    longDescription: 'Create shared goals, track contributions, and celebrate when you hit your target.',
    icon: '/apps/group-fund.svg',
    category: 'social',
    status: 'example',
    interest: 178,
  },
  {
    id: 'gift-drop',
    name: 'GiftDrop',
    description: 'Send surprise gifts to friends and followers.',
    longDescription: 'Create gift drops that recipients can claim, perfect for giveaways and celebrations.',
    icon: '/apps/gift-drop.svg',
    category: 'social',
    status: 'example',
    interest: 321,
  },
  {
    id: 'poll-stake',
    name: 'PollStake',
    description: 'Create polls where participants stake on outcomes.',
    longDescription: 'Make decisions more engaging by letting people put their money where their mouth is.',
    icon: '/apps/poll-stake.svg',
    category: 'social',
    status: 'example',
    interest: 134,
  },
  {
    id: 'challenge-me',
    name: 'ChallengeMe',
    description: 'Bet on personal challenges and goals.',
    longDescription: 'Set challenges, stake currency, and earn rewards for completing your goals.',
    icon: '/apps/challenge-me.svg',
    category: 'social',
    status: 'example',
    interest: 98,
  },
  {
    id: 'fan-club',
    name: 'FanClub',
    description: 'Exclusive communities with membership benefits.',
    longDescription: 'Create gated communities where members pay for exclusive access and perks.',
    icon: '/apps/fan-club.svg',
    category: 'social',
    status: 'example',
    interest: 167,
  },
];

export function getAppById(id: string): App | undefined {
  return EXAMPLE_APPS.find(app => app.id === id);
}

export function getAppsByCategory(category: App['category']): App[] {
  return EXAMPLE_APPS.filter(app => app.category === category);
}

// Unique gradient colors for example apps
const APP_GRADIENTS: Record<string, [string, string]> = {
  // Games
  'lunar-quest': ['#6366F1', '#8B5CF6'],
  'pixel-kingdoms': ['#F59E0B', '#EF4444'],
  'neon-racers': ['#10B981', '#06B6D4'],
  'dungeon-loot': ['#7C3AED', '#EC4899'],
  'card-clash': ['#3B82F6', '#6366F1'],
  'farm-fortune': ['#22C55E', '#84CC16'],
  // Platforms
  'streampay': ['#EC4899', '#F43F5E'],
  'creator-hub': ['#F97316', '#FBBF24'],
  'learn-earn': ['#14B8A6', '#22D3EE'],
  'gig-flow': ['#8B5CF6', '#D946EF'],
  'event-pass': ['#EF4444', '#F97316'],
  'tip-jar': ['#FBBF24', '#F59E0B'],
  // Marketplaces
  'art-vault': ['#D946EF', '#F472B6'],
  'beat-market': ['#7C3AED', '#4F46E5'],
  'template-store': ['#0EA5E9', '#38BDF8'],
  'code-bazaar': ['#059669', '#10B981'],
  'model-market': ['#4F46E5', '#7C3AED'],
  'font-foundry': ['#1F2937', '#4B5563'],
  // Tools
  'pay-link': ['#2563EB', '#3B82F6'],
  'split-it': ['#22C55E', '#4ADE80'],
  'budget-buddy': ['#F59E0B', '#FCD34D'],
  'recurring-pay': ['#6366F1', '#818CF8'],
  'merchant-pos': ['#0891B2', '#06B6D4'],
  'tax-helper': ['#475569', '#64748B'],
  // Social
  'chat-pay': ['#EC4899', '#FB7185'],
  'group-fund': ['#8B5CF6', '#C4B5FD'],
  'gift-drop': ['#F43F5E', '#FB923C'],
  'poll-stake': ['#3B82F6', '#60A5FA'],
  'challenge-me': ['#EF4444', '#FCA5A5'],
  'fan-club': ['#A855F7', '#E879F9'],
};

export function getAppGradient(appId: string): string {
  const colors = APP_GRADIENTS[appId];
  if (colors) {
    return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
  }
  // Fallback: generate from id hash
  const hash = appId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
}
