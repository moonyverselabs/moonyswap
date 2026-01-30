'use client';

export function Footer() {
  return (
    <footer className="border-t border-[#2a2a30] mt-16 bg-[#0c0c0f]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          {/* Brand */}
          <div>
            <h3 className="text-moony-gradient font-semibold mb-2">Moonyswap</h3>
            <p className="text-[#a0a0a8] text-sm">
              Decentralized currency exchange powered by Flipcash Protocol.
            </p>
          </div>

          {/* Social */}
          <a href="https://x.com/moonyswap" target="_blank" rel="noopener noreferrer" className="text-[#a0a0a8] hover:text-white transition-colors inline-flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @moonyswap
          </a>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#2a2a30] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#707078] text-sm">
            © {new Date().getFullYear()} Moonyverse. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-[#707078] hover:text-[#a0a0a8] transition-colors">Terms</a>
            <a href="#" className="text-[#707078] hover:text-[#a0a0a8] transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
