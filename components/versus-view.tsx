'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { fetchWaifuImages, type WaifuImage } from '@/lib/waifu';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { downloadImage } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { Bookmark, Download, Heart, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Pair = [WaifuImage, WaifuImage];

function preloadImage(url: string) {
  const image = new globalThis.Image();
  image.src = url;
}

function ImageCard({
  img,
  loading,
  onPick,
  pickLabel,
}: {
  img: WaifuImage | null;
  loading: boolean;
  onPick: () => void;
  pickLabel: string;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!img) return;
    setBookmarked(isBookmarked(img.id));
  }, [img]);

  return (
    <div className="group relative flex-1 overflow-hidden rounded-2xl border bg-card shadow-lg transition-all hover:shadow-xl">
      <div
        className="relative aspect-[3/4] w-full"
        style={{ backgroundColor: img?.dominantColor ?? '#1f1f23' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
          </div>
        )}
        {img && !loading && (
          <Image
            src={img.url}
            alt={img.tags.map((t) => t.name).join(', ') || 'waifu'}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority
            unoptimized
          />
        )}
        {img && !loading && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        )}

        {img && !loading && (
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => {
                setBookmarked(toggleBookmark(img));
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition',
                bookmarked
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/40 text-white hover:bg-black/60'
              )}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
            </button>
            <button
              onClick={() => void downloadImage(img)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )}

        {img && !loading && img.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {img.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {img && !loading && (
        <div className="p-4">
          <Button
            onClick={onPick}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700"
            size="lg"
          >
            <Heart className="mr-2 h-4 w-4 fill-current" />
            {pickLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VersusView({ nsfw = false }: { nsfw?: boolean }) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState(0);
  const queuedImage = useRef<WaifuImage | null>(null);
  const isFillingQueue = useRef(false);

  const fillQueue = useCallback(async () => {
    if (queuedImage.current || isFillingQueue.current) return;
    isFillingQueue.current = true;
    try {
      const [next] = await fetchWaifuImages({ count: 1, nsfw });
      if (next) {
        queuedImage.current = next;
        preloadImage(next.url);
      }
    } finally {
      isFillingQueue.current = false;
    }
  }, [nsfw]);

  const loadInitial = useCallback(async () => {
    setError(null);
    setPair(null);
    queuedImage.current = null;
    try {
      const items = await fetchWaifuImages({ count: 3, nsfw });
      items.forEach((item) => preloadImage(item.url));
      if (items.length >= 2) {
        setPair([items[0], items[1]]);
        queuedImage.current = items[2] ?? null;
        if (!items[2]) void fillQueue();
      }
    } catch {
      setError('Could not load images. Please retry.');
    }
  }, [fillQueue, nsfw]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const pick = async (side: 'left' | 'right') => {
    if (!pair) return;
    const kept = side === 'left' ? pair[0] : pair[1];
    setPicks((n) => n + 1);
    if (side === 'left') {
      setLoadingRight(true);
    } else {
      setLoadingLeft(true);
    }
    try {
      const next = queuedImage.current ?? (await fetchWaifuImages({ count: 1, nsfw }))[0];
      queuedImage.current = null;
      if (!next) throw new Error('No image returned');
      if (side === 'left') {
        setPair([kept, next]);
      } else {
        setPair([next, kept]);
      }
      void fillQueue();
    } catch {
      setError('Could not load a new image. Retrying...');
    } finally {
      setLoadingLeft(false);
      setLoadingRight(false);
    }
  };

  if (error && !pair) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadInitial} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          Waifu Versus
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick your favorite. The other one refreshes. Keep going as long as you like.
        </p>
        {picks > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {picks} pick{picks === 1 ? '' : 's'} so far
          </p>
        )}
      </div>

      {error && pair && (
        <p className="mb-4 rounded-md bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      {!pair ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <ImageCard
            img={pair[0]}
            loading={loadingLeft}
            onPick={() => pick('left')}
            pickLabel="Pick this one"
          />
          <div className="flex items-center justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              vs
            </span>
          </div>
          <ImageCard
            img={pair[1]}
            loading={loadingRight}
            onPick={() => pick('right')}
            pickLabel="Pick this one"
          />
        </div>
      )}
    </div>
  );
}
