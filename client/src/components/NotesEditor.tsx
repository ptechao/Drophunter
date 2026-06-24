import { useState, useEffect } from 'react';
import { Save, Trash2, Pencil, X } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  airdropId: number;
}

export default function NotesEditor({ airdropId }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noteId, setNoteId] = useState<number | null>(null);

  // Load existing note
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/trpc/notes.get?input=${encodeURIComponent(JSON.stringify({ userId: user.id, airdropId }))}`)
      .then(r => r.json())
      .then(j => {
        const note = j?.result?.data;
        if (note) { setContent(note.content); setNoteId(note.id); }
      })
      .catch(() => {});
  }, [user?.id, airdropId]);

  const save = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/trpc/notes.upsert', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, airdropId, content }),
      });
      const json = await res.json();
      if (json?.result?.data) {
        setNoteId(json.result.data.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } catch (e) { /* ignore */ }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!user?.id) return;
    try {
      await fetch('/api/trpc/notes.delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, airdropId }),
      });
      setContent('');
      setNoteId(null);
    } catch (e) { /* ignore */ }
  };

  if (!user) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-black text-sm flex items-center gap-2">
        <Pencil className="w-4 h-4" /> 個人備注
      </h3>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="寫下你對這個空投的筆記、策略..."
        maxLength={2000}
        rows={3}
        className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:border-gold outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            saved ? 'bg-green-500/10 text-green-400' : 'bg-gold/10 text-gold hover:bg-gold/20'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? '儲存中...' : saved ? '已儲存！' : '儲存'}
        </button>
        {noteId && (
          <button onClick={remove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}