import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-6 px-6 w-full mt-auto flex-shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-70 space-y-4 md:space-y-0 font-bold">
        <Link to="/" className="fancy-nav lime-text text-xl cursor-pointer">LIME MERCHANT</Link>
        <div className="text-sm">© 2024 Lime Merchant. All rights reserved.</div>
        <div className="flex space-x-6 text-sm font-black uppercase tracking-widest">
          <Link to="/privacy" className="hover:text-[var(--lime-primary)]">Privacy</Link>
          <Link to="/terms" className="hover:text-[var(--lime-primary)]">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
