
'use client';

import { Palette } from 'lucide-react';
import { useVibe } from '@/components/providers/VibeProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { openSelector } = useVibe();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getVibeLabel = (v: string | undefined) => {
    switch(v) {
      case 'minimalist': return 'Minimalist';
      case 'cosmic': return 'Cosmic';
      case 'retro': return 'Retro';
      case 'neon': return 'Neon';
      default: return 'Vibe';
    }
  };

  return (
    <button
      onClick={openSelector}
      className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 bg-background/80 hover:bg-foreground/10 text-foreground ring-1 ring-foreground/20"
      aria-label="Change Vibe"
    >
      <Palette className="h-4 w-4" />
      <span>{getVibeLabel(theme)}</span>
    </button>
  );
}
