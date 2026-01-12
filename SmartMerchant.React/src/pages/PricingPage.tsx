import { Link } from 'react-router-dom'

export function PricingPage() {
  return (
    <>
      <div className="text-center mb-16 mt-12">
        <h2 className="slogan-font text-5xl md:text-7xl lime-text slogan-glow mb-4">One PLAN for ALL</h2>
        <div className="oswald font-black text-8xl md:text-9xl uppercase leading-none tracking-tighter">
          3.99<span className="text-4xl md:text-5xl">%</span>
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-widest mt-4">Flat rate per transaction. Zero BS.</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-1 pb-12 overflow-hidden relative border-[var(--lime-primary)]/30">
          <div className="absolute top-0 left-0 w-full h-2 lime-bg shadow-[0_0_20px_var(--lime-glow)]"></div>

          <div className="px-8 pt-12 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-black oswald uppercase">Everything is <span className="lime-text">Included</span></h3>
              <ul className="space-y-4 font-bold">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full lime-bg flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Unlimited Monthly Volume</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full lime-bg flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">24/7 Priority Zoomer Support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full lime-bg flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">Full API Access & Dashboards</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full lime-bg flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-300">No Maintenance Fees</span>
                </li>
              </ul>
              <div className="pt-6">
                <Link to="/register" className="btn-lime w-full py-4 rounded-xl text-xl shadow-xl inline-block text-center">
                  Get Started Free
                </Link>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
              <div className="text-center space-y-4">
                <div className="text-gray-500 uppercase text-xs font-black tracking-widest">Compare</div>
                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 font-bold">
                  <span>Traditional Bank</span>
                  <span className="text-red-400">5.5% + Fees</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 font-bold">
                  <span>Other Stripe Clones</span>
                  <span className="text-gray-400">4.2% + 30¢</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black lime-text">
                  <span>LIME MERCHANT</span>
                  <span>3.99% ONLY</span>
                </div>
                <div className="mt-8 text-xs text-gray-500 leading-relaxed font-bold italic">
                  * We don't charge per active user. We don't charge for the app. We grow only when you grow. That's the Lime promise.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
