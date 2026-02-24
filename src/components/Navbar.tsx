
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <nav className="bg-background border-b border-foreground/10 shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {t('nav.home')}
              </span>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link href="/packages" className="text-foreground/80 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
              {t('nav.packages')}
            </Link>

            {/* Partnership Dropdown / Link */}
            <Link href="/partnership" className="text-foreground/80 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              {t('nav.partnership')}
            </Link>
            
            {session ? (
              <>
                <Link href="/dashboard" className="text-foreground/80 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  {t('nav.dashboard')}
                </Link>
                {(session.user.role === 'admin' || session.user.role === 'staff') && (
                  <Link href="/staff/scan" className="text-foreground/80 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                    {t('nav.scan')}
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-foreground/80 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-foreground/80 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium">
                  {t('nav.login')}
                </Link>
                <Link href="/auth/register" className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-4 py-2 rounded-md text-sm font-medium">
                  {t('nav.register')}
                </Link>
              </>
            )}
            
            <div className="flex items-center space-x-4 border-l border-foreground/10 pl-4">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden space-x-4">
            <ThemeToggle />
            <LanguageToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-background border-t border-foreground/10">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/packages" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-green-600 hover:bg-foreground/5">
              {t('nav.packages')}
            </Link>
            <Link href="/partnership" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-green-600 hover:bg-foreground/5 flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              {t('nav.partnership')}
            </Link>
            {session ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-green-600 hover:bg-foreground/5">
                  {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-red-600 hover:bg-foreground/5"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-green-600 hover:bg-foreground/5">
                  {t('nav.login')}
                </Link>
                <Link href="/auth/register" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-foreground/5">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
