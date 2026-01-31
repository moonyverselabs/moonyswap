'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EXAMPLE_APPS, FLIPCASH_APP, CATEGORY_LABELS, CATEGORY_COLORS, App, getAppGradient } from '@/lib/apps';
import { Footer } from '@/components/Footer';
import { TrendingBar } from '@/components/TrendingBar';

const CATEGORIES: (App['category'] | 'all')[] = ['all', 'game', 'platform', 'marketplace', 'tool', 'social'];
const LOCAL_VOTES_KEY = 'moonyswap_user_votes';

function useVotes() {
  // Vote counts from server (includes base interest + all user votes)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  // Track which apps THIS user has voted for (localStorage, prevents UI double-click)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch vote counts from API on mount
  useEffect(() => {
    // Load user's local vote tracking
    const stored = localStorage.getItem(LOCAL_VOTES_KEY);
    if (stored) {
      setUserVotes(new Set(JSON.parse(stored)));
    }

    // Fetch server vote counts
    fetch('/api/votes')
      .then(res => res.json())
      .then(data => {
        setVoteCounts(data.votes || {});
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const vote = async (appId: string) => {
    if (userVotes.has(appId)) return; // Already voted locally

    // Optimistically update UI
    setUserVotes(prev => {
      const next = new Set(prev);
      next.add(appId);
      localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify([...next]));
      return next;
    });

    setVoteCounts(prev => ({
      ...prev,
      [appId]: (prev[appId] || 0) + 1
    }));

    // Send to server
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });

      if (!res.ok) {
        const data = await res.json();
        // If already voted (IP check), that's fine - keep the optimistic update
        if (!data.alreadyVoted) {
          // Revert on other errors
          setVoteCounts(prev => ({
            ...prev,
            [appId]: Math.max(0, (prev[appId] || 0) - 1)
          }));
        }
      }
    } catch {
      // Network error - keep optimistic update, user might have actually voted
    }
  };

  const getVoteCount = (appId: string) => {
    return voteCounts[appId] || 0;
  };

  return { userVotes, vote, getVoteCount, loading };
}

function AppCard({ app, hasVoted, voteCount, onVote }: { app: App; hasVoted: boolean; voteCount: number; onVote: () => void }) {
  const isExample = app.status === 'example';

  return (
    <div className={`relative bg-[#141418] hover:bg-[#1a1a1f] border border-[#2a2a30] hover:border-[#D8C5FD]/50 rounded-xl p-5 transition-all h-[140px] ${
      isExample ? 'opacity-75' : ''
    }`}>
      {/* Star Button with Vote Count Badge */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onVote();
        }}
        disabled={hasVoted}
        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10 ${
          hasVoted ? 'cursor-default' : 'hover:bg-[#2a2a30]'
        }`}
        title={hasVoted ? 'You voted for this' : 'Vote for this app'}
      >
        <div className="relative">
          <svg
            className={`w-5 h-5 transition-colors ${hasVoted ? 'text-amber-400 fill-amber-400' : 'text-[#505058] hover:text-[#707078]'}`}
            viewBox="0 0 24 24"
            fill={hasVoted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          {/* Vote count badge */}
          {voteCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-[#2a2a30] text-[#a0a0a8] text-[10px] font-medium rounded-full flex items-center justify-center px-1">
              {voteCount > 999 ? '999+' : voteCount}
            </span>
          )}
        </div>
      </button>

      <Link href={`/apps/${app.id}`} className="flex items-start gap-4 h-full">
        {/* App Icon */}
        {app.icon ? (
          <img src={app.icon} alt={app.name} className="w-14 h-14 rounded-xl flex-shrink-0" />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: getAppGradient(app.id) }}
          >
            {app.name.charAt(0)}
          </div>
        )}

        {/* App Info */}
        <div className="flex-1 min-w-0 flex flex-col pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{app.name}</h3>
            {isExample && (
              <span className="text-xs bg-[#2a2a30] text-[#a0a0a8] px-2 py-0.5 rounded">
                Example
              </span>
            )}
          </div>
          <p className="text-[#a0a0a8] text-sm line-clamp-2 flex-1">
            {app.description}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full w-fit ${CATEGORY_COLORS[app.category]}`}>
            {CATEGORY_LABELS[app.category]}
          </span>
        </div>
      </Link>
    </div>
  );
}

const APPS_PER_PAGE = 9;

export default function AppsPage() {
  const [selectedCategory, setSelectedCategory] = useState<App['category'] | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { userVotes, vote, getVoteCount, loading: votesLoading } = useVotes();

  // Filter out Flipcash from the regular grid (it's featured separately)
  const otherApps = EXAMPLE_APPS.filter(app => !app.featured);

  // Filter by category
  const filteredApps = selectedCategory === 'all'
    ? otherApps
    : otherApps.filter(app => app.category === selectedCategory);

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / APPS_PER_PAGE);
  const startIndex = (currentPage - 1) * APPS_PER_PAGE;
  const displayedApps = filteredApps.slice(startIndex, startIndex + APPS_PER_PAGE);

  // Reset to page 1 when category changes
  const handleCategoryChange = (category: App['category'] | 'all') => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-moony-subtle">
      {/* Header */}
      <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl font-bold text-white hover:text-[#D8C5FD] transition-colors">
                Moonyswap
              </Link>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-[#FFF2D9] text-[#0c0c0f] px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 bg-[#0c0c0f] rounded-full animate-pulse" />
                Beta
              </span>
            </div>
            {/* Right: Nav + Social */}
            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/explore" className="px-3 py-1.5 text-sm font-medium text-[#a0a0a8] hover:text-white hover:bg-[#1a1a1f] rounded-lg transition-colors">
                  Currencies
                </Link>
                <span className="px-3 py-1.5 text-sm font-medium text-white bg-[#1a1a1f] rounded-lg">
                  Apps
                </span>
              </nav>
              <a
                href="https://x.com/moonyswap"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#1a1a1f] hover:bg-[#2a2a30] text-[#a0a0a8] hover:text-white rounded-lg transition-colors"
                title="Follow @moonyswap"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Trending Bar */}
      <TrendingBar />

      {/* Hero Section */}
      <section className="border-b border-[#2a2a30]">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-sm text-[#a0a0a8] uppercase tracking-widest mb-3">App Ecosystem</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-moony-gradient mb-4 leading-tight">
                Explore use cases
              </h1>
              <p className="text-[#a0a0a8] max-w-lg leading-relaxed mb-6">
                Currencies aren't just for trading. They power real economies across games, apps, and platforms. Get started with the Flipcash app.
              </p>

              {/* SDK Teaser */}
              <div className="inline-flex items-center gap-2 bg-[#D8C5FD]/10 border border-[#D8C5FD]/30 rounded-full px-4 py-2">
                <span className="w-2 h-2 bg-[#D8C5FD] rounded-full animate-pulse" />
                <span className="text-[#D8C5FD] text-sm font-medium">Flipcash SDK Coming Soon</span>
              </div>
            </div>

            {/* Right: Flipcash App Card */}
            <div className="w-full lg:w-96">
              <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={FLIPCASH_APP.icon}
                    alt={FLIPCASH_APP.name}
                    className="w-14 h-14 rounded-xl"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{FLIPCASH_APP.name}</h3>
                      <span className="inline-flex items-center gap-1.5 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-[#a0a0a8] text-sm">Mobile payments app</p>
                  </div>
                </div>

                <p className="text-[#a0a0a8] text-sm mb-5">
                  Send, receive, and manage all your programmable currencies in one place.
                </p>

                {/* Download Buttons */}
                <div className="flex flex-col gap-2">
                  <a
                    href={FLIPCASH_APP.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black rounded-lg px-4 py-3 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="font-medium">Download on App Store</span>
                  </a>
                  <a
                    href={FLIPCASH_APP.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#1a1a1f] hover:bg-[#2a2a30] border border-[#2a2a30] text-white rounded-lg px-4 py-3 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186a2.372 2.372 0 01-.497-1.478V3.292c0-.547.19-1.051.497-1.478z"/>
                      <path fill="#34A853" d="M16.296 15.504L13.792 12l2.504-3.504 4.212 2.426c.728.418.728 1.44 0 1.86l-4.212 2.722z"/>
                      <path fill="#FBBC04" d="M3.609 22.186l7.427-7.427 2.504 3.504-9.434 5.401a1.867 1.867 0 01-.497-1.478z"/>
                      <path fill="#EA4335" d="M3.609 1.814c.127-.174.29-.326.497-.448l9.434 5.4-2.504 3.505-7.427-7.428-.001-.029z"/>
                    </svg>
                    <span className="font-medium">Get it on Google Play</span>
                  </a>
                </div>

                <a
                  href={FLIPCASH_APP.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[#a0a0a8] hover:text-white text-sm mt-4 transition-colors"
                >
                  Learn more at flipcash.com →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Browser */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Category Tabs */}
        <div className="border-b border-[#2a2a30] mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-px">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  selectedCategory === category
                    ? 'text-[#D8C5FD] border-[#D8C5FD]'
                    : 'text-[#a0a0a8] border-transparent hover:text-white'
                }`}
              >
                {category === 'all' ? 'All Apps' : CATEGORY_LABELS[category]}
                <span className="ml-2 text-xs text-[#707078]">
                  {category === 'all'
                    ? otherApps.length
                    : otherApps.filter(a => a.category === category).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {displayedApps.length > 0 ? (
            displayedApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                hasVoted={userVotes.has(app.id)}
                voteCount={getVoteCount(app.id) || app.interest || 0}
                onVote={() => vote(app.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-[#707078]">No apps in this category yet</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-[#1a1a1f] hover:bg-[#2a2a30] border border-[#2a2a30] text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#D8C5FD] text-[#0c0c0f]'
                      : 'bg-[#1a1a1f] hover:bg-[#2a2a30] text-[#a0a0a8] hover:text-white border border-[#2a2a30]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-[#1a1a1f] hover:bg-[#2a2a30] border border-[#2a2a30] text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}

        {/* Page info */}
        <div className="text-center text-[#707078] text-sm mb-6">
          Showing {startIndex + 1}–{Math.min(startIndex + APPS_PER_PAGE, filteredApps.length)} of {filteredApps.length} apps
        </div>
      </main>

      {/* Developer CTA Section */}
      <section className="border-t border-[#2a2a30] bg-[#0c0c0f]">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Build with SDK */}
            <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <img src="/flipcash.jpg" alt="Flipcash" className="w-5 h-5 rounded" />
                <span className="text-[#FFF2D9] font-medium text-sm">Developers</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#FFF2D9]/20 text-[#FFF2D9] px-1.5 py-0.5 rounded ml-auto">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#FFF2D9] mb-3">
                Build with Flipcash SDK
              </h3>
              <p className="text-[#a0a0a8] mb-6">
                Integrate programmable currencies into your app, game, or platform. Create real economies with guaranteed liquidity.
              </p>
              <a
                href="https://x.com/moonyswap"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#FFF2D9] font-medium hover:text-[#FFF2D9]/80 transition-colors"
              >
                Follow for SDK updates
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Learn About Protocol */}
            <div className="bg-[#141418] border border-[#2a2a30] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <img src="/moony.png" alt="Moony" className="w-5 h-5 rounded" />
                <span className="text-[#D8C5FD] font-medium text-sm">Protocol</span>
              </div>
              <h3 className="text-xl font-bold text-moony-gradient mb-3">
                How Flipcash works
              </h3>
              <p className="text-[#a0a0a8] mb-6">
                Learn about Proof of Capital, bonding curves, and how programmable currencies enable new types of economies.
              </p>
              <a
                href="https://moony.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#D8C5FD] font-medium hover:text-white transition-colors"
              >
                Read the docs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <p className="text-[#707078] mb-4">
              All apps shown are examples of what can be built. Ready to explore currencies?
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 btn-moony rounded-xl transition-colors"
            >
              Go to Exchange
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
