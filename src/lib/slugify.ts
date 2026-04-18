// Simple slugify that preserves Thai characters and replaces spaces/punct with dashes
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, "-")
    .replace(/[^\p{L}\p{N}\-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
