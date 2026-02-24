
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X, Zap, Rocket, Gamepad2, Feather } from 'lucide-react';
import { useVibe } from '@/components/providers/VibeProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';

type VibeType = 'minimalist' | 'cosmic' | 'retro' | 'neon';

export function VibeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isSelectorOpen, openSelector, closeSelector } = useVibe();
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    // Check if user has already selected a vibe preference
    const hasSelectedVibe = localStorage.getItem('vibe-selected');
    if (!hasSelectedVibe) {
      openSelector();
    }
  }, [openSelector]);

  const handleSelect = (vibe: VibeType) => {
    setTheme(vibe);
    closeSelector();
    localStorage.setItem('vibe-selected', 'true');
  };

  if (!mounted || !isSelectorOpen) return null;

  const vibes = [
    {
      id: 'minimalist',
      icon: <Feather className="h-8 w-8" />,
      label: t('vibe.minimalist.label'),
      desc: t('vibe.minimalist.desc'),
      color: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100',
    },
    {
      id: 'cosmic',
      icon: <Rocket className="h-8 w-8" />,
      label: t('vibe.cosmic.label'),
      desc: t('vibe.cosmic.desc'),
      color: 'bg-indigo-950 border-indigo-800 text-indigo-100 hover:bg-indigo-900',
    },
    {
      id: 'retro',
      icon: <Gamepad2 className="h-8 w-8" />,
      label: t('vibe.retro.label'),
      desc: t('vibe.retro.desc'),
      color: 'bg-amber-100 border-amber-300 text-purple-900 hover:bg-amber-200 font-retro',
    },
    {
      id: 'neon',
      icon: <Zap className="h-8 w-8" />,
      label: t('vibe.neon.label'),
      desc: t('vibe.neon.desc'),
      color: 'bg-black border-green-500 text-green-500 hover:bg-gray-900 shadow-[0_0_15px_rgba(34,197,94,0.5)]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity duration-500 animate-in fade-in zoom-in-95">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 text-center transform transition-all duration-500 scale-100 border border-gray-200 dark:border-gray-800">
        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">{t('vibe.title')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          {t('vibe.subtitle')}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => handleSelect(v.id as VibeType)}
              className={`group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${v.color}`}
            >
              <div className="mb-3 transform group-hover:rotate-12 transition-transform duration-300">
                {v.icon}
              </div>
              <span className="font-bold text-xl">{v.label}</span>
              <span className="text-sm opacity-80 mt-1">{v.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
