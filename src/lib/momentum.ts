// Pure client-side calc — uses data already returned by listUserTracks.
// No backend changes required.

export type TrackLike = {
  id: string;
  current_streak?: number | null;
  longest_streak?: number | null;
  last_log_date?: string | null;
  track?: { name?: string; slug?: string; category?: string } | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function computeMomentum(tracks: TrackLike[]) {
  const t = today();
  const totalStreak = tracks.reduce((s, x) => s + (x.current_streak || 0), 0);
  const totalLongest = tracks.reduce((s, x) => s + (x.longest_streak || 0), 0);
  const breadth = tracks.length;
  const todayDone = tracks.filter((x) => x.last_log_date === t).length;

  const consistency = Math.min(400, totalStreak * 5);
  const longevity = Math.min(200, totalLongest * 2);
  const breadthScore = Math.min(150, breadth * 30);
  const todayScore = breadth === 0 ? 0 : Math.round((todayDone / breadth) * 250);

  const score = consistency + longevity + breadthScore + todayScore;
  return {
    score: Math.max(0, Math.min(1000, score)),
    consistency,
    longevity,
    breadth: breadthScore,
    today: todayScore,
    todayDone,
    totalTracks: breadth,
  };
}

export type EvolutionTier = {
  tier: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  next: number | null;
  daysToNext: number;
  ringClass: string;
};

export function evolutionFor(maxStreak: number): EvolutionTier {
  const tiers: { min: number; label: string; ring: string }[] = [
    { min: 0,   label: "Spark",     ring: "evo-tier-0" },
    { min: 7,   label: "Glow",      ring: "evo-tier-1" },
    { min: 21,  label: "Ignite",    ring: "evo-tier-2" },
    { min: 66,  label: "Forged",    ring: "evo-tier-3" },
    { min: 180, label: "Anchored",  ring: "evo-tier-4" },
    { min: 365, label: "Identity",  ring: "evo-tier-5" },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (maxStreak >= tiers[i].min) idx = i;
  const next = idx < tiers.length - 1 ? tiers[idx + 1].min : null;
  return {
    tier: idx as EvolutionTier["tier"],
    label: tiers[idx].label,
    next,
    daysToNext: next ? next - maxStreak : 0,
    ringClass: tiers[idx].ring,
  };
}

export function detectFlow(tracks: TrackLike[]): boolean {
  const consistent = tracks.filter((x) => (x.current_streak || 0) >= 5).length;
  return consistent >= 3;
}

export function atRiskTracks(tracks: TrackLike[]): TrackLike[] {
  const t = today();
  return tracks.filter(
    (x) => (x.current_streak || 0) >= 7 && x.last_log_date !== t,
  );
}

export function maxStreak(tracks: TrackLike[]): number {
  return tracks.reduce((m, x) => Math.max(m, x.current_streak || 0, x.longest_streak || 0), 0);
}