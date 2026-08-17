import type { WaifuImage } from '@/lib/waifu';

export async function downloadImage(image: WaifuImage) {
  const filename = `waifu-${image.id}${image.extension}`;

  try {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  } catch {
    // Preserve a usable fallback if the image host blocks blob downloads.
    const link = document.createElement('a');
    link.href = image.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
