'use client';

import Link from 'next/link';
import { EXAMPLE_APPS, CATEGORY_LABELS, CATEGORY_COLORS, App } from '@/lib/apps';
import { Footer } from '@/components/Footer';

function AppCard({ app }: { app: App }) {
  const isExample = app.status === 'example';

  return (
    <Link
      href={`/apps/${app.id}`}
      className={`block bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 transition-all ${
        isExample ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* App Icon */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl flex-shrink-0">
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
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                Example
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm line-clamp-2 mb-3">
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
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Construction Banner */}
      <div className="bg-amber-500/90 text-slate-900 text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                Moonyswap
              </Link>
              <p className="text-sm text-slate-500">Decentralized Currency Exchange</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              ← Markets
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          {/* SDK Teaser Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Flipcash SDK Coming Soon</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Explore Use Cases
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed mb-8">
            Currencies on Moonyswap are not just for trading. They can power real economies
            across games, apps, platforms, and marketplaces. Any developer can integrate
            Flipcash currencies into their products.
          </p>

          {/* Value Props */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl mb-2">🔌</div>
              <h3 className="text-white font-medium mb-1">Easy Integration</h3>
              <p className="text-slate-500 text-sm">Drop-in SDK for any app or game</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="text-white font-medium mb-1">Any Currency</h3>
              <p className="text-slate-500 text-sm">Accept any Flipcash currency</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="text-2xl mb-2">💧</div>
              <h3 className="text-white font-medium mb-1">Instant Liquidity</h3>
              <p className="text-slate-500 text-sm">Every currency is always tradeable</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">App Ecosystem</h2>
          <span className="text-slate-500 text-sm">{EXAMPLE_APPS.length} examples</span>
        </div>

        {/* Example Apps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {EXAMPLE_APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-800/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Build with Flipcash</h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Be among the first developers to integrate programmable currencies into your app.
            Join the waitlist for early SDK access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://x.com/moonyswap"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              Follow for Updates
            </a>
            <Link
              href="/"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
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
