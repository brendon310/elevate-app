import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { withArchetype, archetypeForSlug } from "@/lib/coach-archetypes";

export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tracks_catalog").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const suggestTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ answer: z.string().min(3).max(800) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");
    const { data: catalog } = await context.supabase
      .from("tracks_catalog").select("slug,name,category,short_description").order("sort_order");
    const list = (catalog ?? []).map(t => `${t.slug} :: ${t.name} (${t.category}) — ${t.short_description}`).join("\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You are a wise, warm life coach. The user just answered: "What is the one thing that, if you changed it, would change everything?". Pick the SINGLE most fitting track for them from this catalog. Respond with strict JSON: {"slug": string, "reason": string (1-2 warm sentences referencing what they said), "identity": string (5-9 words: "You are becoming someone who...")}. Catalog:\n${list}` },
          { role: "user", content: data.answer },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const json = await res.json();
    const txt: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: any; try { parsed = JSON.parse(txt); } catch { parsed = JSON.parse(txt.replace(/^```json\s*|```$/g,"")); }
    const match = (catalog ?? []).find(t => t.slug === parsed.slug) ?? catalog?.[0];
    return { track: match, reason: parsed.reason ?? "", identity: parsed.identity ?? "" };
  });

export const listUserTracks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_tracks")
      .select("*, track:tracks_catalog(*)")
      .eq("user_id", context.userId)
      .order("started_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const activateTracks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    trackIds: z.array(z.string().uuid()).min(1).max(50),
    contract: z.object({
      answer: z.string().max(800).optional(),
      identity: z.string().max(200).optional(),
      commitment: z.string().max(400).optional(),
      signed_at: z.string().optional(),
    }).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const intake = data.contract ? { contract: { ...data.contract, signed_at: data.contract.signed_at ?? new Date().toISOString() } } : undefined;
    const rows = data.trackIds.map((track_id) => ({ user_id: context.userId, track_id, ...(intake ? { intake } : {}) }));
    const { error } = await context.supabase.from("user_tracks").upsert(rows, { onConflict: "user_id,track_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userTrackId: z.string().uuid(),
    completed: z.boolean().default(true),
    mood: z.number().min(1).max(5).optional(),
    note: z.string().max(2000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { error: logErr } = await context.supabase.from("track_logs").upsert({
      user_id: context.userId,
      user_track_id: data.userTrackId,
      log_date: today,
      completed: data.completed,
      mood: data.mood,
      note: data.note,
    }, { onConflict: "user_track_id,log_date" });
    if (logErr) throw new Error(logErr.message);

    // recompute streak
    const { data: ut } = await context.supabase
      .from("user_tracks").select("current_streak,longest_streak,last_log_date,freezes_remaining")
      .eq("id", data.userTrackId).eq("user_id", context.userId).single();
    if (!ut) return { ok: true };

    const last = ut.last_log_date ? new Date(ut.last_log_date) : null;
    const todayD = new Date(today);
    let streak = ut.current_streak ?? 0;
    let freezes = ut.freezes_remaining ?? 0;
    if (!data.completed) {
      // no change
    } else if (!last) {
      streak = 1;
    } else {
      const days = Math.round((+todayD - +last) / 86400000);
      if (days === 0) {
        // same day re-log
      } else if (days === 1) {
        streak += 1;
      } else if (days === 2 && freezes > 0) {
        streak += 1; freezes -= 1;
      } else {
        streak = 1;
      }
    }
    const longest = Math.max(ut.longest_streak ?? 0, streak);
    await context.supabase.from("user_tracks").update({
      current_streak: streak, longest_streak: longest, last_log_date: today, freezes_remaining: freezes,
    }).eq("id", data.userTrackId).eq("user_id", context.userId);
    return { ok: true, streak };
  });

export const getTrackDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cat, error: e1 } = await context.supabase
      .from("tracks_catalog").select("*").eq("slug", data.slug).single();
    if (e1 || !cat) throw new Error("Track not found");

    const { data: ut } = await context.supabase
      .from("user_tracks").select("*").eq("user_id", context.userId).eq("track_id", cat.id).maybeSingle();

    let logs: any[] = [];
    let messages: any[] = [];
    if (ut) {
      const [l, m] = await Promise.all([
        context.supabase.from("track_logs").select("*").eq("user_track_id", ut.id).order("log_date", { ascending: false }).limit(90),
        context.supabase.from("track_messages").select("*").eq("user_track_id", ut.id).order("created_at").limit(200),
      ]);
      logs = l.data ?? [];
      messages = m.data ?? [];
    }
    return { catalog: cat, userTrack: ut, logs, messages };
  });

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userTrackId: z.string().uuid(),
    content: z.string().min(1).max(4000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const { data: ut } = await context.supabase
      .from("user_tracks").select("*, track:tracks_catalog(*)")
      .eq("id", data.userTrackId).eq("user_id", context.userId).single();
    if (!ut) throw new Error("Track not active");

    const { data: history } = await context.supabase
      .from("track_messages").select("role,content")
      .eq("user_track_id", data.userTrackId).order("created_at").limit(40);

    await context.supabase.from("track_messages").insert({
      user_id: context.userId, user_track_id: data.userTrackId, role: "user", content: data.content,
    });

    const messages = [
      { role: "system", content: withArchetype(ut.track.slug, ut.track.ai_system_prompt) + `\n\nUser's current streak: ${ut.current_streak} days. Longest: ${ut.longest_streak}.${(() => { const c: any = (ut.intake as any)?.contract; return c?.answer ? `\n\nThe user's transformation contract said: "${c.answer}". Identity: "${c.identity ?? ""}". Reference it gently when meaningful.` : ""; })()}` },
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.content },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "…";

    await context.supabase.from("track_messages").insert({
      user_id: context.userId, user_track_id: data.userTrackId, role: "assistant", content: reply,
    });

    return { reply };
  });

export const generateWeeklyInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const { data: tracks } = await context.supabase
      .from("user_tracks").select("current_streak,longest_streak,track:tracks_catalog(name,category)")
      .eq("user_id", context.userId);
    const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0,10); })();
    const sinceISO = new Date(Date.now() - 7 * 86400000).toISOString().slice(0,10);
    const { data: logs } = await context.supabase
      .from("track_logs").select("log_date,completed,mood,note,user_track:user_tracks(track:tracks_catalog(name))")
      .eq("user_id", context.userId).gte("log_date", sinceISO);

    const summary = `Tracks: ${JSON.stringify(tracks)}\nLast 7 days logs: ${JSON.stringify(logs)}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are the Elevate weekly insight coach. Output 3 short sections in markdown: **Strongest**, **Struggled**, **Try this week**. Be concrete and warm. <200 words." },
          { role: "user", content: summary },
        ],
      }),
    });
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "No data yet.";
    await context.supabase.from("insights").upsert(
      { user_id: context.userId, week_start: weekStart, content },
      { onConflict: "user_id,week_start" }
    );
    return { content, weekStart };
  });

// ============================================================
// JOURNEY SYSTEM
// ============================================================

const CHUNK_SIZE = 10;
const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];

async function aiJSON(key: string, system: string, user: string): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0,200)}`);
  const json = await res.json();
  const txt: string = json.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(txt); } catch { return JSON.parse(txt.replace(/^```json\s*|```$/g, "")); }
}

async function generateDaysChunk(opts: {
  key: string;
  trackName: string;
  trackPrompt: string;
  totalDays: number;
  startingPoint: string;
  motivation: string;
  obstacle: string;
  fromDay: number;
  toDay: number;
}) {
  const system = `${opts.trackPrompt}

You are designing a science-backed, day-by-day transformation journey for the track "${opts.trackName}".
Total journey length: ${opts.totalDays} days. User starting point: ${opts.startingPoint}.
User motivation: "${opts.motivation || "n/a"}". Biggest obstacle: "${opts.obstacle || "n/a"}".

Output STRICT JSON: { "days": [ { "day_number": int, "title": str, "description": str (2-3 sentences, psychological + practical), "task": str (one concrete actionable task), "reflection": str (one journaling question), "science": str (one relevant scientific or psychological insight, 1-2 sentences), "checkin_prompt": str (one specific AI check-in question about that day) } ] }

Rules:
- Generate exactly days ${opts.fromDay} through ${opts.toDay} inclusive.
- Increase complexity and depth as day_number rises.
- Reference the user's obstacle when relevant.
- Tone: warm, expert, never preachy. No emojis.`;
  const out = await aiJSON(opts.key, system, `Generate days ${opts.fromDay}-${opts.toDay} as JSON.`);
  const days: any[] = Array.isArray(out?.days) ? out.days : [];
  return days.filter(d => d && typeof d.day_number === "number" && d.day_number >= opts.fromDay && d.day_number <= opts.toDay);
}

export const startJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    trackId: z.string().uuid(),
    totalDays: z.number().int().min(7).max(365),
    startingPoint: z.enum(["beginner","been_trying","relapsed","intermediate","advanced"]),
    motivation: z.string().max(400).default(""),
    obstacle: z.string().max(400).default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    // Ensure user_track
    const { data: existingUT } = await context.supabase
      .from("user_tracks").select("*").eq("user_id", context.userId).eq("track_id", data.trackId).maybeSingle();
    let userTrack = existingUT;
    if (!userTrack) {
      const { data: ins, error } = await context.supabase.from("user_tracks")
        .insert({ user_id: context.userId, track_id: data.trackId }).select("*").single();
      if (error) throw new Error(error.message);
      userTrack = ins;
    }

    // If journey exists, return it
    const { data: existingJ } = await context.supabase.from("journeys")
      .select("*").eq("user_track_id", userTrack.id).maybeSingle();
    if (existingJ) return { journeyId: existingJ.id, userTrackId: userTrack.id };

    const { data: cat } = await context.supabase
      .from("tracks_catalog").select("slug,name,ai_system_prompt").eq("id", data.trackId).single();
    if (!cat) throw new Error("Track not found");

    const { data: jr, error: jErr } = await context.supabase.from("journeys").insert({
      user_id: context.userId,
      user_track_id: userTrack.id,
      total_days: data.totalDays,
      starting_point: data.startingPoint,
      motivation: data.motivation,
      obstacle: data.obstacle,
    }).select("*").single();
    if (jErr) throw new Error(jErr.message);

    const to = Math.min(CHUNK_SIZE, data.totalDays);
    const days = await generateDaysChunk({
      key, trackName: cat.name, trackPrompt: withArchetype(cat.slug, cat.ai_system_prompt),
      totalDays: data.totalDays, startingPoint: data.startingPoint,
      motivation: data.motivation, obstacle: data.obstacle, fromDay: 1, toDay: to,
    });
    if (days.length) {
      await context.supabase.from("journey_days").insert(days.map(d => ({
        journey_id: jr.id, user_id: context.userId,
        day_number: d.day_number, title: String(d.title), description: String(d.description),
        task: String(d.task), reflection: String(d.reflection), science: String(d.science),
        checkin_prompt: String(d.checkin_prompt),
      })));
      await context.supabase.from("journeys")
        .update({ generated_through: Math.max(...days.map(d => d.day_number)) })
        .eq("id", jr.id);
    }
    return { journeyId: jr.id, userTrackId: userTrack.id };
  });

export const ensureDaysGenerated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ journeyId: z.string().uuid(), throughDay: z.number().int().min(1).max(365) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");
    const { data: jr } = await context.supabase.from("journeys").select("*").eq("id", data.journeyId).eq("user_id", context.userId).single();
    if (!jr) throw new Error("Journey not found");
    if (jr.generated_through >= data.throughDay || jr.generated_through >= jr.total_days) return { ok: true };

    const { data: ut } = await context.supabase.from("user_tracks").select("track:tracks_catalog(slug,name,ai_system_prompt)").eq("id", jr.user_track_id).single();
    const cat: any = ut?.track;
    if (!cat) throw new Error("Track missing");

    const from = jr.generated_through + 1;
    const to = Math.min(jr.total_days, Math.max(data.throughDay, from + CHUNK_SIZE - 1));
    const days = await generateDaysChunk({
      key, trackName: cat.name, trackPrompt: withArchetype(cat.slug, cat.ai_system_prompt),
      totalDays: jr.total_days, startingPoint: jr.starting_point,
      motivation: jr.motivation, obstacle: jr.obstacle, fromDay: from, toDay: to,
    });
    if (days.length) {
      await context.supabase.from("journey_days").upsert(days.map(d => ({
        journey_id: jr.id, user_id: context.userId,
        day_number: d.day_number, title: String(d.title), description: String(d.description),
        task: String(d.task), reflection: String(d.reflection), science: String(d.science),
        checkin_prompt: String(d.checkin_prompt),
      })), { onConflict: "journey_id,day_number", ignoreDuplicates: true });
      await context.supabase.from("journeys")
        .update({ generated_through: Math.max(jr.generated_through, ...days.map(d => d.day_number)) })
        .eq("id", jr.id);
    }
    return { ok: true };
  });

export const getJourney = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cat } = await context.supabase.from("tracks_catalog").select("*").eq("slug", data.slug).single();
    if (!cat) throw new Error("Track not found");
    const { data: ut } = await context.supabase.from("user_tracks").select("*").eq("user_id", context.userId).eq("track_id", cat.id).maybeSingle();
    if (!ut) return { catalog: cat, userTrack: null, journey: null, days: [], currentDayNumber: 1, isMilestone: null, missedDays: 0 };
    const { data: jr } = await context.supabase.from("journeys").select("*").eq("user_track_id", ut.id).maybeSingle();
    if (!jr) return { catalog: cat, userTrack: ut, journey: null, days: [], currentDayNumber: 1, isMilestone: null, missedDays: 0 };
    const { data: days } = await context.supabase.from("journey_days").select("*").eq("journey_id", jr.id).order("day_number");
    const completedCount = (days ?? []).filter(d => d.completed_at).length;
    const currentDayNumber = Math.min(jr.total_days, completedCount + 1);
    const isMilestone = MILESTONES.includes(completedCount) ? completedCount : null;
    // missed days
    let missedDays = 0;
    if (ut.last_log_date) {
      const days = Math.round((Date.now() - new Date(ut.last_log_date).getTime()) / 86400000);
      missedDays = Math.max(0, days - 1);
    }
    return { catalog: cat, userTrack: ut, journey: jr, days: days ?? [], currentDayNumber, isMilestone, missedDays };
  });

export const completeJourneyDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ dayId: z.string().uuid(), note: z.string().max(2000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: day } = await context.supabase.from("journey_days").select("*, journey:journeys(*)").eq("id", data.dayId).eq("user_id", context.userId).single();
    if (!day) throw new Error("Day not found");
    if (day.completed_at) return { ok: true, alreadyDone: true };
    await context.supabase.from("journey_days").update({ completed_at: new Date().toISOString(), user_note: data.note ?? null }).eq("id", data.dayId);
    // log + streak via logCheckIn logic inlined
    const today = new Date().toISOString().slice(0, 10);
    await context.supabase.from("track_logs").upsert({
      user_id: context.userId, user_track_id: day.journey.user_track_id, log_date: today, completed: true, note: data.note ?? null,
    }, { onConflict: "user_track_id,log_date" });
    const { data: ut } = await context.supabase.from("user_tracks").select("current_streak,longest_streak,last_log_date,freezes_remaining").eq("id", day.journey.user_track_id).single();
    if (ut) {
      const last = ut.last_log_date ? new Date(ut.last_log_date) : null;
      let streak = ut.current_streak ?? 0;
      let freezes = ut.freezes_remaining ?? 0;
      if (!last) streak = 1;
      else {
        const diff = Math.round((Date.now() - +last) / 86400000);
        if (diff === 0) {/* same day */}
        else if (diff === 1) streak += 1;
        else if (diff === 2 && freezes > 0) { streak += 1; freezes -= 1; }
        else streak = 1;
      }
      const longest = Math.max(ut.longest_streak ?? 0, streak);
      await context.supabase.from("user_tracks").update({
        current_streak: streak, longest_streak: longest, last_log_date: today, freezes_remaining: freezes,
      }).eq("id", day.journey.user_track_id);
    }
    return { ok: true, dayNumber: day.day_number, milestoneHit: MILESTONES.includes(day.day_number) ? day.day_number : null };
  });

export const getReEntryMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string(), missedDays: z.number().int().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { message: "You missed some days. That's part of every real journey. The only failure is not coming back. Start with one small action today." };
    const { data: cat } = await context.supabase.from("tracks_catalog").select("name,ai_system_prompt").eq("slug", data.slug).single();
    if (!cat) throw new Error("Track not found");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: cat.ai_system_prompt + "\n\nWrite a 3-4 sentence re-entry message: no shame, normalize the gap, give one concrete tiny re-entry action specific to this track." },
          { role: "user", content: `The user missed ${data.missedDays} day(s) on the "${cat.name}" track. Write the re-entry message.` },
        ],
      }),
    });
    const json = await res.json();
    return { message: json.choices?.[0]?.message?.content ?? "Welcome back. One small step today." };
  });

export const getMilestoneMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string(), dayNumber: z.number().int().min(1).max(365) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    const { data: cat } = await context.supabase.from("tracks_catalog").select("name,ai_system_prompt").eq("slug", data.slug).single();
    if (!cat) throw new Error("Track not found");
    if (!key) return { message: `Day ${data.dayNumber} reached.`, science: "" };
    const out = await aiJSON(key, cat.ai_system_prompt + "\n\nReturn strict JSON: { message: string (2-3 sentences celebrating the milestone, warm and specific), science: string (1-2 sentences of what happens in the brain/body at this point) }", `Milestone day ${data.dayNumber} on "${cat.name}".`);
    return { message: String(out.message ?? ""), science: String(out.science ?? "") };
  });
