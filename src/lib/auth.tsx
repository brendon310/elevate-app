// Public demo build — no real authentication.
// AuthProvider and useAuth are stubs that return a fixed demo user
// so all existing enabled: !!user query guards work unchanged.
import type { ReactNode } from "react";

const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";

type DemoUser = {
  id: string;
  email: string;
  user_metadata: { full_name: string; display_name: string };
} | null;

const DEMO_USER: DemoUser = {
  id: DEMO_USER_ID,
  email: "demo@elevate.app",
  user_metadata: { full_name: "Demo User", display_name: "Demo" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    user: DEMO_USER,
    session: null,
    loading: false,
    signOut: async () => {},
  };
}
