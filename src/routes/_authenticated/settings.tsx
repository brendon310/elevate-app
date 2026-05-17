import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteAccount } from "@/lib/account.functions";
import { toast } from "sonner";
import {
  User as UserIcon,
  Bell,
  Shield,
  Palette,
  LogOut,
  Trash2,
  KeyRound,
  Mail,
  Moon,
  Sun,
  Globe,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

type Prefs = {
  notifBrowser: boolean;
  reminderTime: string; // "HH:mm"
  notifStreak: boolean;
  notifInsight: boolean;
  language: "en" | "it";
  theme: "light" | "dark";
};

const DEFAULTS: Prefs = {
  notifBrowser: false,
  reminderTime: "09:00",
  notifStreak: true,
  notifInsight: true,
  language: "en",
  theme: "light",
};

const STORAGE_KEY = "elevate:prefs";

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function SettingsPage() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const deleteAccountFn = useServerFn(deleteAccount);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Prefs (local)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name ?? "";
        setDisplayName(n);
        setOriginalName(n);
      });
  }, [user?.id]);

  // Hydrate prefs once + apply theme
  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    document.documentElement.classList.toggle("dark", p.theme === "dark");
  }, []);

  const updatePrefs = (patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (patch.theme) {
        document.documentElement.classList.toggle("dark", patch.theme === "dark");
      }
      return next;
    });
  };

  const saveName = async () => {
    if (!user?.id) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    setSavingName(false);
    if (error) return toast.error(error.message);
    setOriginalName(displayName.trim());
    toast.success("Name updated");
  };

  const requestBrowserNotifs = async (enabled: boolean) => {
    if (!enabled) return updatePrefs({ notifBrowser: false });
    if (typeof window === "undefined" || !("Notification" in window)) {
      return toast.error("Your browser does not support notifications");
    }
    const res = await Notification.requestPermission();
    if (res !== "granted") {
      toast.error("Permission denied");
      return updatePrefs({ notifBrowser: false });
    }
    updatePrefs({ notifBrowser: true });
    toast.success("Notifications enabled");
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent to your email");
  };

  const confirmDelete = async () => {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccountFn();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      nav({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-display">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, preferences and data.</p>
      </header>

      {/* ACCOUNT */}
      <Section icon={<UserIcon className="h-4 w-4" />} title="Account">
        <Field label="Display name">
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={saveName}
              disabled={savingName || displayName.trim() === originalName.trim() || !displayName.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </Field>

        <Field label="Email">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{user?.email}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">read only</span>
          </div>
        </Field>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={sendPasswordReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <KeyRound className="h-4 w-4" />
            Change password
          </button>
          <button
            onClick={() => signOut().then(() => nav({ to: "/" }))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <button
            onClick={() => {
              setDeleteText("");
              setDeleteOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete account
          </button>
        </div>
      </Section>

      {/* NOTIFICATIONS */}
      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <Toggle
          label="Browser notifications"
          desc="Get nudges directly from your browser."
          checked={prefs.notifBrowser}
          onChange={requestBrowserNotifs}
        />
        <div className="flex items-center justify-between gap-3 py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium">Daily check-in reminder</p>
            <p className="text-xs text-muted-foreground">When we ping you to log your day.</p>
          </div>
          <input
            type="time"
            value={prefs.reminderTime}
            onChange={(e) => updatePrefs({ reminderTime: e.target.value })}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Toggle
          label="Streak at risk alert"
          desc="Warn me before I break a streak."
          checked={prefs.notifStreak}
          onChange={(v) => updatePrefs({ notifStreak: v })}
        />
        <Toggle
          label="Weekly insight ready"
          desc="Tell me when my weekly letter is ready."
          checked={prefs.notifInsight}
          onChange={(v) => updatePrefs({ notifInsight: v })}
        />
      </Section>

      {/* APPEARANCE */}
      <Section icon={<Palette className="h-4 w-4" />} title="Appearance">
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Language
            </p>
            <p className="text-xs text-muted-foreground">More languages coming soon.</p>
          </div>
          <Select value={prefs.language} onValueChange={(v) => updatePrefs({ language: v as Prefs["language"] })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark.</p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => updatePrefs({ theme: "light" })}
              className={
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold " +
                (prefs.theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              <Sun className="h-3.5 w-3.5" /> Light
            </button>
            <button
              onClick={() => updatePrefs({ theme: "dark" })}
              className={
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold " +
                (prefs.theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              <Moon className="h-3.5 w-3.5" /> Dark
            </button>
          </div>
        </div>
      </Section>

      {/* PRIVACY */}
      <Section icon={<Shield className="h-4 w-4" />} title="Privacy & Legal">
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-medium mb-1">Your data</p>
          <p className="text-muted-foreground">
            We store your check-ins, reflections, and journey progress. You can delete everything at any time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Terms of Service
          </a>
        </div>
      </Section>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Signed in as {user?.email}
      </p>

      {/* DELETE MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete account
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground/80">
              This will permanently delete all your data, journeys, and progress. This action is{" "}
              <span className="font-semibold text-destructive">irreversible</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Type DELETE to confirm
            </label>
            <input
              autoFocus
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteText !== "DELETE" || deleting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              {deleting ? "Deleting…" : <><Trash2 className="h-4 w-4" /> Delete forever</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Building blocks ---------- */
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted">
          {icon}
        </span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-t border-border first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-medium flex items-center gap-1.5">
          {label}
          {checked && <Check className="h-3.5 w-3.5 text-[oklch(var(--tertiary))]" />}
        </p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}