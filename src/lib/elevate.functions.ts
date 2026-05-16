import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tracks_catalog").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
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
  .inputValidator((d) => z.object({ trackIds: z.array(z.string().uuid()).min(1).max(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const rows = data.trackIds.map((track_id) => ({ user_id: context.userId, track_id }));
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
      { role: "system", content: ut.track.ai_system_prompt + `\n\nUser's current streak: ${ut.current_streak} days. Longest: ${ut.longest_streak}.` },
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
