import { Link } from 'react-router-dom'

export function FeaturesPage() {
  return (
    <>
      <div className="text-center mb-16 space-y-4 mt-12">
        <h2 className="text-5xl md:text-7xl font-black oswald uppercase tracking-tight">
          Built for <span className="lime-text">Speed</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-bold">
          We ripped up the old banking rulebook to give you features that actually help you grow your brand.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="glass-card p-8 hover:bg-white/5 transition-colors group">
          <div className="w-14 h-14 rounded-2xl feature-icon flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black oswald uppercase mb-3">Instant Settlements</h3>
          <p className="text-gray-400 leading-relaxed font-bold">
            Why wait 3 days? Get your money in your account the moment a customer pays. Real-time cashflow for real-time business.
          </p>
        </div>

        <div className="glass-card p-8 hover:bg-white/5 transition-colors group">
          <div className="w-14 h-14 rounded-2xl feature-icon flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black oswald uppercase mb-3">Modern Checkout</h3>
          <p className="text-gray-400 leading-relaxed font-bold">
            Full support for Apple Pay, Google Pay, and crypto. One-tap checkout that keeps your conversion rates high.
          </p>
        </div>

        <div className="glass-card p-8 hover:bg-white/5 transition-colors group">
          <div className="w-14 h-14 rounded-2xl feature-icon flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black oswald uppercase mb-3">No-Cap Analytics</h3>
          <p className="text-gray-400 leading-relaxed font-bold">
            Deep insights into your customer behavior. Beautiful charts that actually make sense, right in your mobile app.
          </p>
        </div>

        <div className="glass-card p-8 hover:bg-white/5 transition-colors group lg:col-span-2">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <div className="w-14 h-14 rounded-2xl feature-icon flex items-center justify-center mb-6">
                <svg className="w-8 h-8 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-black oswald uppercase mb-3">API-First Design</h3>
              <p className="text-gray-400 leading-relaxed font-bold">
                Developer-friendly SDKs and clear documentation. Integrate Lime into your existing stack in under 15 minutes.
              </p>
            </div>
            <div className="w-full md:w-1/2 bg-black/40 p-4 rounded-xl font-mono text-xs border border-white/5">
              <div className="text-gray-500 mb-2">// Initialize Lime SDK</div>
              <div><span className="lime-text">const</span> lime = <span className="text-blue-400">new</span> LimeMerchant(<span className="text-orange-400">'API_KEY_42'</span>);</div>
              <div className="mt-2"><span className="text-purple-400">await</span> lime.settle({'{'}</div>
              <div className="pl-4">amount: <span className="text-lime-400">1337.00</span>,</div>
              <div className="pl-4">currency: <span className="text-orange-400">'UAH'</span></div>
              <div>{'}'});</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 hover:bg-white/5 transition-colors group">
          <div className="w-14 h-14 rounded-2xl feature-icon flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black oswald uppercase mb-3">Ironclad Security</h3>
          <p className="text-gray-400 leading-relaxed font-bold">
            PCI-DSS Level 1 certified. We handle the security compliance so you can focus on your craft.
          </p>
        </div>
      </div>

      <div className="mt-20 text-center">
        <Link to="/register" className="btn-lime px-12 py-5 rounded-2xl text-xl font-black shadow-2xl inline-block">
          Start Accepting Payments
        </Link>
      </div>
    </>
  )
}
