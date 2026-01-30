'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EXAMPLE_APPS, CATEGORY_LABELS, CATEGORY_COLORS, App } from '@/lib/apps';
import { Footer } from '@/components/Footer';

const CATEGORIES: (App['category'] | 'all')[] = ['all', 'game', 'platform', 'marketplace', 'tool', 'social'];

function AppCard({ app }: { app: App }) {
  const isExample = app.status === 'example';

  return (
    <Link
      href={`/apps/${app.id}`}
      className={`block bg-[#141418] hover:bg-[#1a1a1f] border border-[#2a2a30] hover:border-[#D8C5FD]/50 rounded-xl p-5 transition-all ${
        isExample ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* App Icon */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2a2a30] to-[#1a1a1f] flex items-center justify-center text-2xl flex-shrink-0">
          {app.category === 'game' && '🎮'}
          {app.category === 'marketplace' && '🏪'}
          {app.category === 'platform' && '🚀'}
          {app.category === 'tool' && '🔧'}
          {app.category === 'social' && '💬'}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{app.name}</h3>
            {isExample && (
              <span className="text-xs bg-[#2a2a30] text-[#a0a0a8] px-2 py-0.5 rounded">
                Example
              </span>
            )}
          </div>
          <p className="text-[#a0a0a8] text-sm line-clamp-2 mb-3">
            {app.description}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[app.category]}`}>
            {CATEGORY_LABELS[app.category]}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AppsPage() {
  const [selectedCategory, setSelectedCategory] = useState<App['category'] | 'all'>('all');

  const filteredApps = selectedCategory === 'all'
    ? EXAMPLE_APPS
    : EXAMPLE_APPS.filter(app => app.category === selectedCategory);

  return (
    <div className="min-h-screen bg-moony-subtle">
      {/* Construction Banner */}
      <div className="bg-amber-500/90 text-[#0c0c0f] text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-[#2a2a30] bg-[#0c0c0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-bold text-white hover:text-[#D8C5FD] transition-colors">
                Moonyswap
              </Link>
              <p className="text-sm text-[#a0a0a8]">Decentralized Currency Exchange</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#2a2a30] text-[#a0a0a8] rounded-lg text-sm font-medium transition-colors"
            >
              ← Markets
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#2a2a30]">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          {/* SDK Teaser Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D8C5FD]/10 border border-[#D8C5FD]/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-[#D8C5FD] rounded-full animate-pulse" />
            <span className="text-[#D8C5FD] text-sm font-medium">Flipcash SDK Coming Soon</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-moony-gradient mb-4">
            Explore Use Cases
          </h1>
          <p className="text-[#a0a0a8] max-w-2xl mx-auto text-lg leading-relaxed mb-8">
            Currencies on Moonyswap are not just for trading. They can power real economies
            across games, apps, platforms, and marketplaces. Any developer can integrate
            Flipcash currencies into their products.
          </p>

          {/* Value Props */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-[#141418]/50 border border-[#2a2a30] rounded-xl p-4">
              <div className="text-2xl mb-2">🔌</div>
              <h3 className="text-white font-medium mb-1">Easy Integration</h3>
              <p className="text-[#707078] text-sm">Drop-in SDK for any app or game</p>
            </div>
            <div className="bg-[#141418]/50 border border-[#2a2a30] rounded-xl p-4">
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="text-white font-medium mb-1">Any Currency</h3>
              <p className="text-[#707078] text-sm">Accept any Flipcash currency</p>
            </div>
            <div className="bg-[#141418]/50 border border-[#2a2a30] rounded-xl p-4">
              <div className="text-2xl mb-2">💧</div>
              <h3 className="text-white font-medium mb-1">Instant Redemption</h3>
              <p className="text-[#707078] text-sm">Any currency redeemable to USDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-moony-gradient">App Ecosystem</h2>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'btn-moony'
                    : 'bg-[#1a1a1f] text-[#a0a0a8] hover:bg-[#2a2a30] hover:text-white'
                }`}
              >
                {category === 'all' ? 'All' : CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered Apps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-[#707078]">No apps in this category yet</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#D8C5FD]/10 to-[#141418] border border-[#D8C5FD]/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-moony-gradient mb-2">Build with Flipcash</h3>
          <p className="text-[#a0a0a8] mb-6 max-w-lg mx-auto">
            Be among the first developers to integrate programmable currencies into your app.
            Join the waitlist for early SDK access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://x.com/moonyswap"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 btn-moony rounded-xl transition-colors"
            >
              Follow for Updates
            </a>
            <Link
              href="/"
              className="px-6 py-3 bg-[#1a1a1f] hover:bg-[#2a2a30] text-white font-medium rounded-xl transition-colors"
            >
              Explore Currencies
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
