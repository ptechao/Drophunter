import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  airdropId: number;
}

export default function BookmarkButton({ airdropId }: Props) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: isBookmarked } = (trpc as any).social.isBookmarked.useQuery(
    { userId: user?.id, airdropId },
    { enabled: !!user?.id }
  );

  const toggleBookmark = async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/social.toggleBookmark', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, airdropId }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        setBookmarked(json.result.data.bookmarked);
      }
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  const active = isBookmarked || bookmarked;

  return (
    <button
      onClick={toggleBookmark}
      disabled={!user || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
        active
          ? 'bg-gold/10 text-gold'
          : 'bg-muted text-foreground/50 border border-border hover:text-gold'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
      {active ? '已收藏' : '收藏'}
    </button>
  );
}