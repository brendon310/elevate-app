# Elevate — Build Plan

A premium, AI-powered self-improvement companion with 50 specialized AI coaches, streaks, dashboards, and weekly insights.

## Scope for v1

Building all 50 tracks with full depth (onboarding interview, milestone roadmap, daily AI check-ins, pattern analysis, crisis support, weekly insight reports, push notifications) in a single pass would produce a thin, unstable app. I'll ship a strong, real v1 that covers the full surface and can be deepened iteratively.

**In v1:**
- Auth (email/password + Google) with persistent storage
- All 50 tracks defined with category, color, icon, and a specialized AI system prompt referencing real frameworks (NRT/CBT/Allen Carr, progressive overload, MBSR, etc.)
- Onboarding: pick top 5 tracks to start
- Dashboard: active tracks with streak counters, completion rings, momentum score, overall Elevate Score
- Per-track page: daily log, progress chart, GitHub-style heatmap, milestone map, AI chat
- AI chat per track using **Lovable AI Gateway** (not Anthropic directly — explained below), with full per-track conversation history persisted
- Streak logic with freeze/grace days
- Weekly AI-generated insight report (on-demand generation button in v1)
- Dark premium aesthetic, smooth micro-animations, mobile-first

**Deferred to follow-ups (called out so you can prioritize):**
- Real push notifications (requires native app or web-push infra setup) — v1 shows in-app daily check-in reminders
- Automated daily AI check-in messages (cron) — v1 triggers them when the user opens the track
- Deep onboarding interview flow per track — v1 uses a structured intake form + first AI message; can be expanded
- Crisis-support escalation UX

## Important technical note: AI provider

You asked for Anthropic Claude API. Lovable has a built-in **Lovable AI Gateway** that already includes credits, requires no key setup, and supports top models (Gemini 3, GPT-5.x families). It's the recommended path and avoids you having to manage an Anthropic key, billing, and rate limits.

I'll use Lovable AI Gateway with `google/gemini-3-flash-preview` as the default coach model (fast, cheap, strong). If you specifically want Anthropic Claude, tell me and I'll switch — you'd need to add an `ANTHROPIC_API_KEY` secret.

## Backend (Lovable Cloud)

I'll enable Lovable Cloud (Supabase under the hood) for auth + database.

**Tables:**
- `profiles` — user profile (display name, avatar, elevate_score_cached)
- `tracks_catalog` — the 50 tracks (seeded): id, slug, name, category, color, icon, description, ai_system_prompt, frameworks
- `user_tracks` — user's activated tracks: user_id, track_id, started_at, current_streak, longest_streak, freezes_remaining, status
- `track_logs` — daily check-ins: user_id, user_track_id, date, completed, mood, note
- `track_messages` — AI chat history per track: user_id, user_track_id, role, content, created_at
- `milestones` — user_track_id, label (day 1, week 1, month 1, ...), target_date, achieved_at
- `insights` — weekly AI reports: user_id, week_start, content_json

RLS on every table scoped to `auth.uid()`. Roles in separate table not needed for v1.

## Frontend structure (TanStack Start)

```text
src/routes/
  index.tsx                  Landing (logged out) / redirect to /app (logged in)
  login.tsx                  Email + Google sign-in
  _authenticated.tsx         Auth gate
  _authenticated/
    onboarding.tsx           Pick top 5 tracks
    app.tsx                  Main dashboard (active tracks, Elevate Score, heatmap summary)
    tracks.tsx               Browse/add tracks (all 50)
    track.$slug.tsx          Per-track page: log, chart, heatmap, milestones, AI chat
    insights.tsx             Weekly AI insight report
    settings.tsx             Profile + sign out
  api/chat.ts                Server route for AI coach streaming (Lovable AI Gateway)
```

Server functions for: activating a track, logging a check-in, computing streaks, generating insight reports, listing tracks, etc.

## Design

Dark premium: deep near-black background, warm off-white text, accent gradients per track category (fitness=ember, mental=indigo, quit=crimson, learning=teal, productivity=amber). Inter/Geist body, tight type, generous spacing. Subtle glass cards, ring progress, GitHub-style heatmap grid, satisfying spring animations on check-in (Motion). Mobile-first with a bottom tab bar on small screens, sidebar on desktop.

## Implementation order

1. Enable Lovable Cloud, create schema + RLS, seed the 50 tracks catalog with curated AI system prompts and frameworks per track
2. Design system (tokens, gradients, fonts) in `src/styles.css`
3. Auth (login/signup + Google) + `_authenticated` gate + onboarding (pick 5)
4. Dashboard with active tracks, streaks, Elevate Score, heatmap summary
5. Per-track page: log, chart, heatmap, milestones
6. AI chat per track via `/api/chat` server route (Lovable AI Gateway, streaming) with persisted history
7. Weekly insight report generation
8. Polish: micro-animations, empty states, mobile bottom nav

## Confirm before I start

1. **AI provider**: OK to use Lovable AI Gateway (no key needed) instead of Anthropic? Or do you want Anthropic specifically?
2. **Sign-in methods**: Email/password + Google OK?
3. **Scope**: Ship the v1 above and iterate on deferred items (real push, automated daily check-ins, deep per-track onboarding interview), or do you want any of those moved into v1?

Reply "go" with answers and I'll build it.