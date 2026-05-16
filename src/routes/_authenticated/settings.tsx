import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <div className="glass rounded-2xl p-6 mt-6">
        <p className="text-xs uppercase text-muted-foreground tracking-widest">Account</p>
        <p className="mt-1 text-sm">{user?.email}</p>
        <button onClick={()=>signOut().then(()=>nav({to:"/"}))} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Sign out</button>
      </div>
    </div>
  );
}
