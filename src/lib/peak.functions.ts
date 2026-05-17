import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPeakStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("peak_reached_at")
      .eq("id", context.userId)
      .maybeSingle();
    return { peakReachedAt: (data?.peak_reached_at as string | null) ?? null };
  });

export const markPeakReached = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only set if not already set — keep the first-ever moment.
    const { data: existing } = await context.supabase
      .from("profiles")
      .select("peak_reached_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (existing?.peak_reached_at) {
      return { peakReachedAt: existing.peak_reached_at as string, firstTime: false };
    }
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("profiles")
      .update({ peak_reached_at: now })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { peakReachedAt: now, firstTime: true };
  });