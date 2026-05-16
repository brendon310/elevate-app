export const CATEGORY_CLASS: Record<string, string> = {
  "Fitness & Body": "grad-fitness",
  "Mental Health": "grad-mental",
  "Quit Bad Habits": "grad-quit",
  "Mind & Learning": "grad-learning",
  "Productivity & Life": "grad-productivity",
};

export const CATEGORY_TEXT: Record<string, string> = {
  "Fitness & Body": "text-[color:var(--fitness)]",
  "Mental Health": "text-[color:var(--mental)]",
  "Quit Bad Habits": "text-[color:var(--quit)]",
  "Mind & Learning": "text-[color:var(--learning)]",
  "Productivity & Life": "text-[color:var(--productivity)]",
};

export const CATEGORY_SHADOW: Record<string, string> = {
  "Fitness & Body": "depth-red",
  "Mental Health": "depth-green",
  "Quit Bad Habits": "depth-yellow",
  "Mind & Learning": "depth-violet",
  "Productivity & Life": "depth-violet",
};

/* Category-driven accent — only one of red/green/yellow/white/gray per track */
const CATEGORY_HUE: Record<string, string> = {
  "Fitness & Body": "--fitness",
  "Mental Health": "--mental",
  "Quit Bad Habits": "--quit",
  "Mind & Learning": "--learning",
  "Productivity & Life": "--productivity",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function trackHueVar(seed: string, category?: string): string {
  if (category && CATEGORY_HUE[category]) return CATEGORY_HUE[category];
  return "--hue-white";
}

export function trackHueGradient(seed: string, _category?: string): string {
  // Each track gets a slightly different grayscale shade — accent stays mono.
  const shades = [
    ["oklch(0.22 0 0)", "oklch(0.10 0 0)"],
    ["oklch(0.20 0 0)", "oklch(0.09 0 0)"],
    ["oklch(0.24 0 0)", "oklch(0.12 0 0)"],
    ["oklch(0.18 0 0)", "oklch(0.08 0 0)"],
    ["oklch(0.26 0 0)", "oklch(0.13 0 0)"],
    ["oklch(0.21 0 0)", "oklch(0.11 0 0)"],
  ];
  const [a, b] = shades[hashStr(seed) % shades.length];
  return `linear-gradient(160deg, ${a}, ${b})`;
}

export function trackHueShadow(seed: string, category?: string): string {
  const v = trackHueVar(seed, category);
  return `0 20px 50px -12px color-mix(in oklab, var(${v}) 60%, transparent), 0 4px 14px -4px color-mix(in oklab, var(${v}) 40%, transparent)`;
}
