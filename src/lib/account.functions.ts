import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    // Clean app data (RLS-bypassing admin client). Order: child tables first.
    const tables = [
      "community_post_flames",
      "community_posts",
      "track_messages",
      "track_logs",
      "journey_days",
      "journeys",
      "insights",
      "user_tracks",
      "profiles",
    ] as const;
    for (const t of tables) {
      await supabaseAdmin.from(t).delete().eq(t === "profiles" ? "id" : "user_id", uid);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });