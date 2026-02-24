
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type VibeContextType = {
  isSelectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
};

const VibeContext = createContext<VibeContextType | undefined>(undefined);

export function VibeProvider({ children }: { children: ReactNode }) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const openSelector = () => setIsSelectorOpen(true);
  const closeSelector = () => setIsSelectorOpen(false);

  return (
    <VibeContext.Provider value={{ isSelectorOpen, openSelector, closeSelector }}>
      {children}
    </VibeContext.Provider>
  );
}

export function useVibe() {
  const context = useContext(VibeContext);
  if (context === undefined) {
    throw new Error('useVibe must be used within a VibeProvider');
  }
  return context;
}
