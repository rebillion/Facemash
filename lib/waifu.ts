export type WaifuArtist = {
  id: number;
  name: string;
  patreon: string | null;
  pixiv: string | null;
  twitter: string | null;
  deviantArt: string | null;
};

export type WaifuTag = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type WaifuImage = {
  id: number;
  extension: string;
  dominantColor: string;
  source: string | null;
  artists: WaifuArtist[];
  isNsfw: boolean;
  isAnimated: boolean;
  width: number;
  height: number;
  byteSize: number;
  url: string;
  tags: WaifuTag[];
  favorites: number;
};

type WaifuResponse = {
  items: WaifuImage[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
};

const BASE = 'https://api.waifu.im/images';

export async function fetchWaifuImages(opts: {
  count?: number;
  tag?: string | null;
  nsfw?: boolean;
} = {}): Promise<WaifuImage[]> {
  const { count = 1, tag = null, nsfw = false } = opts;
  const params = new URLSearchParams({
    IsNsfw: nsfw ? 'True' : 'False',
    PageSize: String(count),
  });
  if (tag) params.set('IncludedTags', tag);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`waifu.im request failed: ${res.status}`);
  const data: WaifuResponse = await res.json();
  return data.items;
}

export async function fetchWaifuGallery(
  page = 1,
  tag: string | null = null,
  nsfw = false
) {
  const params = new URLSearchParams({
    IsNsfw: nsfw ? 'True' : 'False',
    Page: String(page),
    PageSize: '30',
  });
  if (tag) params.set('IncludedTags', tag);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`waifu.im request failed: ${res.status}`);
  const data: WaifuResponse = await res.json();
  return {
    items: data.items,
    totalPages: data.totalPages,
    page: data.pageNumber,
    totalCount: data.totalCount,
  };
}
