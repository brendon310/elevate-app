import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(50%_50%_at_50%_0%,oklch(0.30_0.10_60_/_0.4),transparent)]" />
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl grad-productivity flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-background" />
          </div>
          <span className="font-semibold tracking-tight text-lg">Elevate</span>
        </Link>

        <div className="glass rounded-2xl p-6">
          <h1 className="text-xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "signin" ? "Continue your journey." : "Start with your top 5 habits."}</p>

          <button onClick={google} disabled={busy} className="mt-6 w-full rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#fff" d="M21.35 11.1H12v3.2h5.35c-.23 1.2-.95 2.2-2.03 2.88v2.4h3.28c1.92-1.77 3.03-4.38 3.03-7.48 0-.7-.07-1.4-.18-2z"/><path fill="#fff" opacity=".6" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.28-2.4c-.9.6-2.07.97-3.34.97-2.57 0-4.75-1.73-5.53-4.07H3.13v2.55C4.77 19.78 8.13 22 12 22z"/></svg>
            Continue with Google
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <span className="relative bg-card px-2 text-xs text-muted-foreground">or</span>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-lg bg-input border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"
              className="w-full rounded-lg bg-input border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
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
