'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Home, Moon, Sun, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { getBookmarkIds } from '@/lib/bookmarks';
import VersusView from '@/components/versus-view';
import GalleryView from '@/components/gallery-view';
import BookmarksView from '@/components/bookmarks-view';

type Tab = 'versus' | 'gallery' | 'bookmarks';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'versus', label: 'Versus', icon: Swords },
  { id: 'gallery', label: 'Discover', icon: Home },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
];

export default function AppPage() {
  const [tab, setTab] = useState<Tab>('versus');
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [nsfw, setNsfw] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('waifu:theme');
    setDarkMode(savedTheme ? savedTheme === 'dark' : true);
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('waifu:theme', darkMode ? 'dark' : 'light');
  }, [darkMode, themeLoaded]);

  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return;
      setBookmarkCount(getBookmarkIds().length);
    };
    update();
    window.addEventListener('waifu:bookmarks-changed', update);
    return () => window.removeEventListener('waifu:bookmarks-changed', update);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-rose-50/30 dark:to-rose-950/10">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
              <Swords className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">WaifuVersus</span>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-full border bg-muted/40 p-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4',
                    tab === id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {id === 'bookmarks' && bookmarkCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {bookmarkCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-2 py-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                <span className="hidden sm:inline">{nsfw ? 'NSFW' : 'SFW'}</span>
                <Switch checked={nsfw} onCheckedChange={setNsfw} aria-label="Show NSFW images" />
              </label>
              <button
                onClick={() => setDarkMode((current) => !current)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {tab === 'versus' && <VersusView nsfw={nsfw} />}
        {tab === 'gallery' && <GalleryView nsfw={nsfw} />}
        {tab === 'bookmarks' && <BookmarksView />}
      </main>

    </div>
  );
}
