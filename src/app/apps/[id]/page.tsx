'use client';

import { use } from 'react';
import Link from 'next/link';
import { getAppById, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/apps';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AppDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const app = getAppById(id);

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <Link href="/apps" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
              Moonyswap
            </Link>
          </div>
        </header>
        <div className="flex items-center justify-center py-32">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
            <p className="text-red-400 font-semibold text-lg">App not found</p>
            <Link
              href="/apps"
              className="inline-block mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              ← Back to apps
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExample = app.status === 'example';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Construction Banner */}
      <div className="bg-amber-500/90 text-slate-900 text-center py-2 text-sm font-medium">
        This site is under construction · Confidential preview
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
            Moonyswap
          </Link>
          <Link
            href="/apps"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            ← All Apps
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* App Hero */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Icon */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-5xl flex-shrink-0">
              {app.category === 'game' && '🎮'}
              {app.category === 'marketplace' && '🏪'}
              {app.category === 'platform' && '🚀'}
              {app.category === 'tool' && '🔧'}
              {app.category === 'social' && '💬'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{app.name}</h1>
                {isExample && (
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">
                    Example App
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[app.category]}`}>
                  {CATEGORY_LABELS[app.category]}
                </span>
                {app.status === 'live' && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Live
                  </span>
                )}
                {app.status === 'coming-soon' && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              <p className="text-slate-400 leading-relaxed">
                {app.longDescription || app.description}
              </p>

              {app.url && app.status === 'live' && (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                >
                  Visit App
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Example Notice */}
        {isExample && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                💡
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">This is an example app</h3>
                <p className="text-slate-400 text-sm">
                  This app demonstrates how developers could integrate Flipcash currencies into their products.
                  Real apps will appear here once the Flipcash SDK is available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">How Flipcash Integration Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h4 className="text-white font-medium mb-1">Choose Currency</h4>
              <p className="text-slate-500 text-sm">
                App selects which Flipcash currencies to accept as payment
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h4 className="text-white font-medium mb-1">Integrate SDK</h4>
              <p className="text-slate-500 text-sm">
                Drop-in payments, balances, and transfers with a few lines of code
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h4 className="text-white font-medium mb-1">Go Live</h4>
              <p className="text-slate-500 text-sm">
                Users can earn, spend, and trade currency across all integrated apps
              </p>
            </div>
          </div>
        </div>

        {/* Supported Currencies Placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-4">Supported Currencies</h2>
          <p className="text-slate-500 text-sm mb-6">
            Apps can choose which Flipcash currencies to accept. Users holding those currencies
            can spend them directly within the app.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            Browse all currencies
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
