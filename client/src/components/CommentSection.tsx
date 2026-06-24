import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: number;
  userId: number;
  airdropId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  user: { id: number; address: string } | null;
}

interface Props {
  airdropId: number;
}

export default function CommentSection({ airdropId }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/trpc/comments.list?input=${encodeURIComponent(JSON.stringify({ airdropId }))}`);
      const json = await res.json();
      setComments(json?.result?.data || []);
      setLoaded(true);
    } catch (e) { /* ignore */ }
  };

  if (!loaded) {
    loadComments();
    return <div className="text-sm text-foreground/40 py-4">載入討論中...</div>;
  }

  const submit = async () => {
    if (!user?.id || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/trpc/comments.create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, airdropId, content: content.trim() }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        setComments(prev => [...prev, {
          ...json.result.data,
          user: { id: user.id, address: user.address?.slice(0, 6) + '...' + user.address?.slice(-4) },
        }]);
        setContent('');
      }
    } catch (e) { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const remove = async (id: number) => {
    if (!user?.id) return;
    try {
      await fetch('/api/trpc/comments.delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, userId: user.id }),
      });
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-black text-sm">💬 討論串 ({comments.length})</h3>

      {/* Comment list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="bg-background rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-gold">{c.user?.address || '匿名'}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-foreground/30">{c.createdAt?.slice(0, 16)}</span>
                {c.userId === user?.id && (
                  <button onClick={() => remove(c.id)} className="text-foreground/20 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-foreground/70">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-foreground/40">尚無留言，成為第一個討論的人！</p>
        )}
      </div>

      {/* Input */}
      {user ? (
        <div className="flex gap-2">
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="留下你的想法..."
            maxLength={1000}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
          />
          <button
            onClick={submit}
            disabled={submitting || !content.trim()}
            className="bg-gold text-black px-3 py-2 rounded-lg text-sm font-black hover:bg-gold/80 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-foreground/40">請先連接錢包才能留言</p>
      )}
    </div>
  );
}