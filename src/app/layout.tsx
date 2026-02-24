import type { Metadata } from 'next';
import { Inter, Press_Start_2P, Shrikhand, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
// Footer component
import Footer from '@/components/Footer';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { VibeProvider } from '@/components/providers/VibeProvider';
import { VibeSelector } from '@/components/VibeSelector';
import { MoodMessage } from '@/components/MoodMessage';
import { SoundManager } from '@/components/SoundManager';
import { Chatbot } from '@/components/Chatbot';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const pressStart2P = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-retro' });
const shrikhand = Shrikhand({ weight: '400', subsets: ['latin'], variable: '--font-groovy' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-vintage' });

export const metadata: Metadata = {
  title: 'Cikapundung River - Wisata & Edukasi',
  description: 'Ticketing system for Cikapundung River managed by MoedaTrace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${pressStart2P.variable} ${shrikhand.variable} ${playfair.variable}`}>
        <NextAuthProvider>
          <ThemeProvider 
            attribute="data-theme" 
            defaultTheme="minimalist" 
            enableSystem={false} 
            disableTransitionOnChange 
            themes={['minimalist', 'cosmic', 'retro', 'neon']}
          >
            <VibeProvider>
              <LanguageProvider>
                <div className="min-h-screen flex flex-col transition-colors duration-500 bg-background text-foreground">
                  <Navbar />
                  <MoodMessage />
                  <VibeSelector />
                  <SoundManager />
                  <Chatbot />
                  <main className="flex-grow">{children}</main>
                  <Footer />
                </div>
              </LanguageProvider>
            </VibeProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
