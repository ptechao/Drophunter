import { Link } from 'react-router-dom';
import { Target, Menu, Globe } from 'lucide-react';
import { useState } from 'react';
import { useLanguageContext, Language } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

const LANG_LABELS: Record<Language, string> = {
  'zh-TW': '繁',
  'zh-CN': '简',
  'en': 'EN',
};

const LANG_ORDER: Language[] = ['zh-TW', 'zh-CN', 'en'];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguageContext();
  const { t } = useTranslation();

  const cycleLang = () => {
    const idx = LANG_ORDER.indexOf(language);
    setLanguage(LANG_ORDER[(idx + 1) % LANG_ORDER.length]);
  };

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-black text-lg text-gold">
          <Target className="w-6 h-6" />
          DropHunter
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/airdrops" className="text-sm font-bold text-foreground/70 hover:text-gold transition-colors">
            {t('nav.airdrops')}
          </Link>
          <button
            onClick={cycleLang}
            className="flex items-center gap-1 text-sm font-black text-foreground/50 hover:text-gold transition-colors px-2 py-1 rounded"
            title="Switch language"
          >
            <Globe className="w-4 h-4" />
            {LANG_LABELS[language]}
          </button>
          <button className="bg-gold text-black px-4 py-1.5 rounded-lg text-sm font-black hover:bg-gold/80 transition-colors">
            {t('nav.connect')}
          </button>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <button onClick={cycleLang} className="p-1 text-foreground/50">
            <Globe className="w-4 h-4" />
          </button>
          <button className="p-2" onClick={() => setOpen(!open)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/airdrops" className="block text-sm font-bold" onClick={() => setOpen(false)}>
            {t('nav.airdrops')}
          </Link>
          <button className="w-full bg-gold text-black px-4 py-2 rounded-lg text-sm font-black">
            {t('nav.connect')}
          </button>
        </div>
      )}
    </nav>
  );
}
