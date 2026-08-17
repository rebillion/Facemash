import type { WaifuImage } from '@/lib/waifu';

const BOOKMARKS_KEY = 'waifu:bookmarks';
const BOOKMARK_METADATA_KEY = 'waifu:bookmarks:meta';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function notify() {
  window.dispatchEvent(new Event('waifu:bookmarks-changed'));
}

export function getBookmarkIds() {
  return read<number[]>(BOOKMARKS_KEY, []);
}

export function getBookmarks() {
  return Object.values(read<Record<number, WaifuImage>>(BOOKMARK_METADATA_KEY, {}));
}

export function isBookmarked(id: number) {
  return getBookmarkIds().includes(id);
}

export function toggleBookmark(image: WaifuImage) {
  if (typeof window === 'undefined') return false;
  const ids = getBookmarkIds();
  const metadata = read<Record<number, WaifuImage>>(BOOKMARK_METADATA_KEY, {});
  const bookmarked = !ids.includes(image.id);
  const nextIds = bookmarked ? [...ids, image.id] : ids.filter((id) => id !== image.id);

  if (bookmarked) metadata[image.id] = image;
  else delete metadata[image.id];

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(nextIds));
  localStorage.setItem(BOOKMARK_METADATA_KEY, JSON.stringify(metadata));
  notify();
  return bookmarked;
}

export function removeBookmark(id: number) {
  if (typeof window === 'undefined') return;
  const metadata = read<Record<number, WaifuImage>>(BOOKMARK_METADATA_KEY, {});
  delete metadata[id];
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(getBookmarkIds().filter((item) => item !== id)));
  localStorage.setItem(BOOKMARK_METADATA_KEY, JSON.stringify(metadata));
  notify();
}
