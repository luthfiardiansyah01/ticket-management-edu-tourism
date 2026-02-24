
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function MoodMessage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentTheme = theme;

    switch (currentTheme) {
      case 'minimalist':
        setMessage(t('mood.minimalist'));
        break;
      case 'cosmic':
        setMessage(t('mood.cosmic'));
        break;
      case 'retro':
        setMessage(t('mood.retro'));
        break;
      case 'neon':
        setMessage(t('mood.neon'));
        break;
      default:
        setMessage(t('mood.default'));
    }
  }, [theme, resolvedTheme, mounted, t]);

  if (!mounted) return null;

  return (
    <div className="w-full text-center py-2 bg-background/50 backdrop-blur-sm text-sm font-medium border-b border-foreground/10 animate-fade-in transition-colors duration-500">
      {message}
    </div>
  );
}
