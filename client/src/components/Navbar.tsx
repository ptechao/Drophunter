import { Link } from 'react-router-dom';
import { Target, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-black text-lg text-gold">
          <Target className="w-6 h-6" />
          DropHunter
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link to="/airdrops" className="text-sm font-bold text-foreground/70 hover:text-gold transition-colors">
            Airdrops
          </Link>
          <button className="bg-gold text-black px-4 py-1.5 rounded-lg text-sm font-black hover:bg-gold/80 transition-colors">
            Connect Wallet
          </button>
        </div>

        {/* Mobile nav */}
        <button className="sm:hidden p-2" onClick={() => setOpen(!open)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/airdrops" className="block text-sm font-bold" onClick={() => setOpen(false)}>Airdrops</Link>
          <button className="w-full bg-gold text-black px-4 py-2 rounded-lg text-sm font-black">Connect Wallet</button>
        </div>
      )}
    </nav>
  );
}
