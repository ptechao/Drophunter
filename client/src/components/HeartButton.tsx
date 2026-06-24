import { useState } from 'react';
import { Heart } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  airdropId: number;
  initialLikes?: number;
}

export default function HeartButton({ airdropId, initialLikes = 0 }: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  // Check initial state when user exists
  const { data: isLiked } = (trpc as any).social.isLiked.useQuery(
    { userId: user?.id, airdropId },
    { enabled: !!user?.id }
  );

  const toggleLike = async () => {
    if (!user?.id || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trpc/social.toggleLike', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, airdropId }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        setLiked(json.result.data.liked);
        setCount(c => json.result.data.liked ? c + 1 : c - 1);
      }
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  const currentlyLiked = isLiked || liked;

  return (
    <button
      onClick={toggleLike}
      disabled={!user || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
        currentlyLiked
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-muted text-foreground/50 border border-border hover:text-red-400'
      }`}
    >
      <Heart className={`w-4 h-4 ${currentlyLiked ? 'fill-current' : ''}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}