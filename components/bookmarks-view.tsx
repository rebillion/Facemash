'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import type { WaifuImage } from '@/lib/waifu';
import { getBookmarks, removeBookmark } from '@/lib/bookmarks';
import { downloadImage } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { Bookmark, Download, Trash2 } from 'lucide-react';

export default function BookmarksView() {
  const [items, setItems] = useState<WaifuImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    setItems(getBookmarks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('waifu:bookmarks-changed', onChange);
    return () => window.removeEventListener('waifu:bookmarks-changed', onChange);
  }, [refresh]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Your Bookmarks</h1>
        <p className="text-sm text-muted-foreground">
          Everything you saved lives here, even after you reload the page.
        </p>
      </div>

      {!loaded ? null : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No bookmarks yet. Tap the bookmark icon on any image to save it here.
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {items.map((img) => {
            const aspect = img.width && img.height ? img.width / img.height : 3 / 4;
            return (
              <div
                key={img.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
              >
                <div
                  className="relative w-full"
                  style={{ backgroundColor: img.dominantColor || '#1f1f23', aspectRatio: aspect }}
                >
                  <Image
                    src={img.url}
                    alt={img.tags.map((t) => t.name).join(', ') || 'waifu'}
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                    unoptimized
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute right-2.5 top-2.5 flex gap-2">
                    <button
                      onClick={() => void downloadImage(img)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeBookmark(img.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-rose-600"
                      title="Remove bookmark"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {img.tags.length > 0 && (
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                      {img.tags.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
