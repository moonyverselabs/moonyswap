'use client';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-16 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-semibold mb-3">Moonyswap</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Decentralized currency exchange powered by Flipcash Protocol.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#tokens" className="text-slate-500 hover:text-white transition-colors">Markets</a>
              </li>
              <li>
                <a href="/swap" className="text-slate-500 hover:text-white transition-colors">Swap</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://docs.flipcash.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                  Flipcash Docs
                </a>
              </li>
              <li>
                <a href="https://docs.moony.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                  Moony Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://x.com/moonyswap" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @moonyswap
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Moonyverse. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
