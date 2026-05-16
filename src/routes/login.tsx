import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) nav({ to: "/app" }); }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (res.error) { toast.error(res.error.message); setBusy(false); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10
        bg-[radial-gradient(60%_60%_at_50%_20%,oklch(0.62_0.215_275_/_0.45),transparent_70%),radial-gradient(45%_55%_at_80%_80%,oklch(0.70_0.215_340_/_0.30),transparent_70%)]" />
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="h-9 w-9 rounded-2xl grad-electric flex items-center justify-center shadow-[var(--shadow-violet)]">
            <span className="font-display text-white text-lg leading-none font-bold">e</span>
          </div>
          <span className="font-display tracking-tight font-semibold">Elevate</span>
        </Link>

        <div className="depth-card rounded-[1.75rem] p-7">
          <h1 className="font-display text-3xl leading-tight tracking-tight">{mode === "signin" ? "Welcome back." : <>Begin <span className="text-electric">again</span>.</>}</h1>
          <p className="text-sm text-muted-foreground mt-2">{mode === "signin" ? "Pick up where you left off." : "One question stands between you and day one."}</p>

          <button onClick={google} disabled={busy} className="mt-6 w-full rounded-xl border border-border bg-card/60 hover:bg-accent transition px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.2-.95 2.2-2.03 2.88v2.4h3.28c1.92-1.77 3.03-4.38 3.03-7.48 0-.7-.07-1.4-.18-2z"/><path fill="#fff" opacity=".6" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.28-2.4c-.9.6-2.07.97-3.34.97-2.57 0-4.75-1.73-5.53-4.07H3.13v2.55C4.77 19.78 8.13 22 12 22z"/></svg>
            Continue with Google
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <span className="relative bg-card px-2 text-xs text-muted-foreground">or</span>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-xl bg-input border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition" />
            <input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"
              className="w-full rounded-xl bg-input border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring transition" />
            <button type="submit" disabled={busy} className="btn-chunk w-full rounded-xl grad-electric text-white px-4 py-3.5 text-sm font-bold shadow-[var(--shadow-violet)] disabled:opacity-50">
              {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button onClick={()=>setMode(mode==="signin"?"signup":"signin")} className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">
            {mode==="signin" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
