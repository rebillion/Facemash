'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { fetchWaifuGallery, type WaifuImage, type WaifuTag } from '@/lib/waifu';
import { isBookmarked, toggleBookmark } from '@/lib/bookmarks';
import { downloadImage } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, Download, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

async function fetchWaifuTags(): Promise<WaifuTag[]> {
  const res = await fetch('https://api.waifu.im/tags', {
    headers: { Accept: 'application/json' },
    cache: 'force-cache',
  });
  if (!res.ok) throw new Error(`waifu.im tag request failed: ${res.status}`);

  const data: unknown = await res.json();
  if (Array.isArray(data)) return data as WaifuTag[];
  if (data && typeof data === 'object') {
    const values = data as { items?: unknown; tags?: unknown };
    if (Array.isArray(values.items)) return values.items as WaifuTag[];
    if (Array.isArray(values.tags)) return values.tags as WaifuTag[];
  }
  return [];
}

function GalleryCard({ img, eager = false }: { img: WaifuImage; eager?: boolean }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(img.id));
    const onChange = () => setBookmarked(isBookmarked(img.id));
    window.addEventListener('waifu:bookmarks-changed', onChange);
    return () => window.removeEventListener('waifu:bookmarks-changed', onChange);
  }, [img.id]);

  const aspect = img.width && img.height ? img.width / img.height : 3 / 4;

  return (
    <div className="group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
      <div
        className="relative w-full"
        style={{ backgroundColor: img.dominantColor || '#1f1f23', aspectRatio: aspect }}
      >
        <Image
          src={img.url}
          alt={img.tags.map((t) => t.name).join(', ') || 'waifu'}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          priority={eager}
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        <div className="absolute right-2.5 top-2.5 flex gap-2">
          <button
            onClick={() => {
              setBookmarked(toggleBookmark(img));
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition',
              bookmarked
                ? 'bg-rose-500 text-white'
                : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
            )}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark className={cn('h-3.5 w-3.5', bookmarked && 'fill-current')} />
          </button>
          <button
            onClick={() => void downloadImage(img)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-md transition hover:bg-black/60 group-hover:opacity-100"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
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
}

export default function GalleryView({ nsfw = false }: { nsfw?: boolean }) {
  const [images, setImages] = useState<WaifuImage[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [tags, setTags] = useState<WaifuTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchWaifuTags().then(setTags).catch(() => setTags([]));
  }, []);

  const loadPage = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setLoaded(false);
    setError(null);
    try {
      const res = await fetchWaifuGallery(p, tag, nsfw);
      setImages((prev) => (append ? [...prev, ...res.items] : res.items));
      setHasMore(p < res.totalPages);
    } catch {
      setError('Could not load gallery images.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [nsfw, tag]);

  useEffect(() => {
    setPage(1);
    setImages([]);
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const next = page + 1;
          setPage(next);
          loadPage(next, true);
        }
      },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, hasMore, loadPage]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Discover</h1>
          <p className="text-sm text-muted-foreground">
            A Pinterest-style feed of anime art. Bookmark or download anything you like.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPage(1);
            loadPage(1, false);
          }}
          disabled={loading}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const nextTag = query.trim().replace(/^:/, '').toLowerCase() || null;
          setTag(nextTag);
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder=""
            aria-label="Search images by tag"
            list="waifu-tags"
          />
          <datalist id="waifu-tags">
            {tags.map((availableTag) => (
              <option key={availableTag.id} value={availableTag.slug}>
                {availableTag.name}
              </option>
            ))}
          </datalist>
        </div>
        <Button type="submit">Search</Button>
        {tag && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setQuery('');
              setTag(null);
            }}
          >
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </form>

      {tag && (
        <p className="-mt-3 mb-5 text-sm text-muted-foreground">
          Showing images tagged <span className="font-medium text-foreground">{tag}</span>
        </p>
      )}

      {error && images.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => loadPage(1, false)} variant="outline">
            Retry
          </Button>
        </div>
      )}

      {images.length === 0 && !error && !loaded ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      ) : images.length === 0 && !error ? (
        <div className="py-24 text-center text-muted-foreground">
          No images found{tag ? ` for “${tag}”` : ''}. Try another tag or content filter.
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {images.map((img, index) => (
            <GalleryCard key={img.id} img={img} eager={index < 4} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />

      {loading && images.length > 0 && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
