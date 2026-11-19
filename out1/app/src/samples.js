/** Built-in sample photos for instant use. */
export const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', url: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', url: 'samples/pier.jpg' },
  { id: 'sunset-drive', name: 'Sunset Drive', url: 'samples/sunset-drive.jpg' },
  { id: 'neon-alley', name: 'Neon Alley', url: 'samples/neon-alley.jpg' },
];

/** Load a sample by id, return a promise resolving to an HTMLImageElement. */
export async function loadSample(id) {
  const sample = SAMPLES.find(s => s.id === id);
  if (!sample) throw new Error(`Sample not found: ${id}`);
  return loadImage(sample.url);
}

/** Generic image loader returning a promise<HTMLImageElement>. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
