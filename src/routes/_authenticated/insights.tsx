import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  Trophy,
  CheckCircle2,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { generateWeeklyInsight, getInsightsData } from "@/lib/elevate.functions";

export const Route = createFileRoute("/_authenticated/insights")({ component: Insights });

function Insights() {
  const qc = useQueryClient();
  const fetchData = useServerFn(getInsightsData);
  const genFn = useServerFn(generateWeeklyInsight);

  const { data, isLoading } = useQuery({
    queryKey: ["insights-data"],
    queryFn: () => fetchData(),
  });

  const gen = useMutation({
    mutationFn: () => genFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insights-data"] }),
    onError: (e: any) => toast.error(e.message ?? "Could not generate report"),
  });

  // Auto-generate on load if user has data and no cached report for this week.
  useEffect(() => {
    if (!data) return;
    if (data.hasData && !data.cachedInsight && !gen.isPending && !gen.isSuccess) {
      gen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.hasData, data?.cachedInsight]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display">Your Weekly Letter</h1>
        <p className="text-muted-foreground mt-1">The page where the data tells the truth.</p>
      </header>

      {isLoading || !data ? (
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      ) : !data.hasData ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Log a check-in on any track to start seeing your insights.</p>
        </div>
      ) : (
        <>
          <ComparisonStrip c={data.compare} />
          <Heatmap days={data.heatmap} />
          <MomentumChart series={data.momentum30} />
          <TrackStats tracks={data.perTrack} />
          <ReportSection
            content={data.cachedInsight?.content ?? gen.data?.content ?? ""}
            loading={gen.isPending || (!data.cachedInsight && !gen.data && data.hasData)}
            onRegenerate={() => gen.mutate()}
            regenerating={gen.isPending}
          />
        </>
      )}
    </div>
  );
}

/* ---------- This week vs last week ---------- */
function ComparisonStrip({ c }: { c: any }) {
  const items = [
    { label: "Consistency", now: c.thisConsistency, prev: c.lastConsistency, suffix: "%" },
    { label: "Momentum", now: c.thisMomentum, prev: c.lastMomentum, suffix: "" },
    { label: "Days completed", now: c.thisWeekDone, prev: c.lastWeekDone, suffix: "" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => {
        const diff = it.now - it.prev;
        const up = diff > 0, down = diff < 0;
        return (
          <div key={it.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{it.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{it.now}{it.suffix}</span>
              <span
                className={
                  "inline-flex items-center gap-0.5 text-xs font-semibold " +
                  (up ? "text-[oklch(var(--tertiary))]" : down ? "text-[oklch(var(--destructive))]" : "text-muted-foreground")
                }
              >
                {up ? <ArrowUpRight className="h-3 w-3" /> : down ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {diff > 0 ? "+" : ""}{diff}{it.suffix}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">vs last week ({it.prev}{it.suffix})</p>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 90-day heatmap ---------- */
function Heatmap({ days }: { days: { date: string; count: number }[] }) {
  // Build columns: groups of 7 (weeks), oldest left.
  const weeks = useMemo(() => {
    const cols: { date: string; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
  }, [days]);
  const totalDone = days.filter((d) => d.count > 0).length;

  const tone = (count: number) => {
    if (count <= 0) return "bg-muted";
    if (count === 1) return "bg-[oklch(var(--tertiary)/0.35)]";
    if (count === 2) return "bg-[oklch(var(--tertiary)/0.6)]";
    return "bg-[oklch(var(--tertiary))]";
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-semibold">90-day activity</h2>
          <p className="text-xs text-muted-foreground">{totalDone} active days out of 90.</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(var(--tertiary)/0.35)]" />
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(var(--tertiary)/0.6)]" />
          <span className="h-2.5 w-2.5 rounded-sm bg-[oklch(var(--tertiary))]" />
          <span>More</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-1">
            {w.map((d) => (
              <div
                key={d.date}
                title={`${d.date} — ${d.count} check-in${d.count === 1 ? "" : "s"}`}
                className={`h-3 w-3 rounded-sm ${tone(d.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 30-day momentum line ---------- */
function MomentumChart({ series }: { series: { date: string; score: number }[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Momentum, last 30 days</h2>
      <p className="text-xs text-muted-foreground mb-3">Daily completion strength across your tracks.</p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 1000]} hide />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid oklch(var(--border))", background: "oklch(var(--card))" }}
              labelFormatter={(v) => v}
              formatter={(v: any) => [v, "Momentum"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="oklch(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ---------- Per-track cards ---------- */
function TrackStats({ tracks }: { tracks: any[] }) {
  if (!tracks.length) return null;
  return (
    <section>
      <h2 className="font-semibold mb-3">Per-track</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {tracks.map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate">{t.name}</h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={t.currentStreak} />
              <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="Best" value={t.longestStreak} />
              <Stat icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Done" value={t.totalDone} />
              <Stat icon={<Target className="h-3.5 w-3.5" />} label="Rate" value={`${t.completionRate}%`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted p-2">
      <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider">
        {icon}{label}
      </div>
      <p className="font-bold text-base mt-0.5">{value}</p>
    </div>
  );
}

/* ---------- AI report ---------- */
function ReportSection({
  content,
  loading,
  onRegenerate,
  regenerating,
}: {
  content: string;
  loading: boolean;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">This week's letter</h2>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border border-border bg-card px-3 py-1.5 hover:bg-muted disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {regenerating ? "Writing…" : content ? "Regenerate" : "Generate"}
        </button>
      </div>
      {loading && !content ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-muted rounded animate-pulse" />
        </div>
      ) : content ? (
        <ReportCard markdown={content} />
      ) : null}
    </section>
  );
}

/* ---------- Markdown rendering ---------- */
// Parses the 3-section format into styled blocks. Falls back to plain rendering.
function ReportCard({ markdown }: { markdown: string }) {
  const sections = useMemo(() => splitSections(markdown), [markdown]);

  if (!sections.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 prose-content">
        {renderMarkdownBlocks(markdown)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {sections.map((s, i) => {
        const meta = sectionMeta(s.heading);
        return (
          <div
            key={i}
            className={
              "p-6 border-b border-border last:border-b-0 " + meta.bg
            }
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={"inline-flex h-7 w-7 items-center justify-center rounded-full " + meta.badge}>
                {meta.icon}
              </span>
              <h3 className={"font-bold tracking-tight " + meta.text}>{s.heading}</h3>
            </div>
            <div className="text-sm leading-relaxed text-foreground/90">
              {renderMarkdownBlocks(s.body)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function sectionMeta(heading: string) {
  const h = heading.toLowerCase();
  if (h.includes("strong")) {
    return {
      icon: <TrendingUp className="h-4 w-4 text-white" />,
      badge: "bg-[oklch(var(--tertiary))]",
      text: "text-[oklch(var(--tertiary))]",
      bg: "",
    };
  }
  if (h.includes("strugg")) {
    return {
      icon: <TrendingDown className="h-4 w-4 text-white" />,
      badge: "bg-[oklch(var(--destructive))]",
      text: "text-[oklch(var(--destructive))]",
      bg: "",
    };
  }
  return {
    icon: <Sparkles className="h-4 w-4 text-white" />,
    badge: "bg-foreground",
    text: "text-foreground",
    bg: "",
  };
}

function splitSections(md: string): { heading: string; body: string }[] {
  // Match H1/H2/H3 or bold-line headings.
  const lines = md.split(/\r?\n/);
  const out: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^#{1,3}\s+(.+)$/) || line.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
    if (h) {
      if (current) out.push(current);
      current = { heading: h[1].trim().replace(/[:.]$/, ""), body: [] };
    } else if (current) {
      current.body.push(raw);
    }
  }
  if (current) out.push(current);
  return out.map((s) => ({ heading: s.heading, body: s.body.join("\n").trim() }));
}

function renderMarkdownBlocks(md: string) {
  const blocks: React.ReactNode[] = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1 my-2">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // Collect paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*[-*]\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2">
        {renderInline(para.join(" "))}
      </p>,
    );
  }
  return <>{blocks}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handles **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={key++} className="font-semibold">{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{t.slice(1, -1)}</code>);
    else parts.push(<em key={key++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}