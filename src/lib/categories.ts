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
  "Fitness & Body": "depth-coral",
  "Mental Health": "depth-violet",
  "Quit Bad Habits": "depth-coral",
  "Mind & Learning": "depth-violet",
  "Productivity & Life": "depth-mint",
};

/* 12 vivid distinct hues — every track gets its own truly different color */
const HUE_VARS = [
  "--hue-violet", "--hue-coral", "--hue-mint", "--hue-yellow",
  "--hue-pink", "--hue-cyan", "--hue-orange", "--hue-lime",
  "--hue-sky", "--hue-magenta", "--hue-red", "--hue-teal",
] as const;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function trackHueVar(seed: string): string {
  return HUE_VARS[hashStr(seed) % HUE_VARS.length];
}

export function trackHueGradient(seed: string): string {
  const a = HUE_VARS[hashStr(seed) % HUE_VARS.length];
  const b = HUE_VARS[(hashStr(seed) + 5) % HUE_VARS.length];
  return `linear-gradient(135deg, var(${a}), var(${b}))`;
}

export function trackHueShadow(seed: string): string {
  const v = trackHueVar(seed);
  return `0 20px 50px -12px color-mix(in oklab, var(${v}) 60%, transparent), 0 4px 14px -4px color-mix(in oklab, var(${v}) 40%, transparent)`;
}
