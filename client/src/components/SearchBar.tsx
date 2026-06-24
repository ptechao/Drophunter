import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Result {
  id: number;
  name: string;
  protocol: string;
  chain: string;
  imageUrl: string | null;
}

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/trpc/search.autocomplete?input=${encodeURIComponent(JSON.stringify({ q, limit: 6 }))}`);
        const json = await res.json();
        setResults(json?.result?.data || []);
        setOpen(true);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="搜尋空投..."
          className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:border-gold outline-none transition-colors"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gold" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {results.map(r => (
            <Link
              key={r.id}
              to={`/airdrops/${r.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
              onClick={() => { setQ(''); setOpen(false); }}
            >
              {r.imageUrl && <img src={r.imageUrl} alt="" className="w-7 h-7 rounded-lg bg-muted" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{r.name}</p>
                <p className="text-[10px] text-foreground/40">{r.protocol} · {r.chain}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}