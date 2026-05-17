import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    // Clean app data (RLS-bypassing admin client). Order: child tables first.
    await supabaseAdmin.from("community_post_flames").delete().eq("user_id", uid);
    await supabaseAdmin.from("community_posts").delete().eq("user_id", uid);
    await supabaseAdmin.from("track_messages").delete().eq("user_id", uid);
    await supabaseAdmin.from("track_logs").delete().eq("user_id", uid);
    await supabaseAdmin.from("journey_days").delete().eq("user_id", uid);
    await supabaseAdmin.from("journeys").delete().eq("user_id", uid);
    await supabaseAdmin.from("insights").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_tracks").delete().eq("user_id", uid);
    await supabaseAdmin.from("profiles").delete().eq("id", uid);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });