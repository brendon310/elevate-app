
# Elevate v2 — "Organic Futurism" elevation

This is a huge brief. To ship something that actually feels premium (not half-done across 15 features), I'll deliver it in 3 phases. Phase 1 is the visual + identity overhaul that makes the whole app feel like a funded startup on first open — that alone changes the perception of every existing screen. Phases 2 and 3 layer in the new features on top of that foundation.

I'll start Phase 1 immediately on approval. Phases 2 and 3 ship in follow-up turns so each one gets real care instead of being rushed.

---

## Phase 1 — Design system overhaul + core micro-interactions (this turn)

The single biggest lever. Touches every screen.

**Design tokens (`src/styles.css`)**
- Replace palette with the warm dark system:
  - `--background: #0D0A07`, `--surface: #1A1410`
  - `--primary: #E8A87C` (amber), `--secondary: #C4785A` (terracotta)
  - `--foreground: #F5EDD8` (cream), `--muted-foreground: #8C7B6B`
  - `--success: #7FB069`
- Kill Inter. Load **Fraunces** (variable serif, opsz + soft axis) for headlines/milestones and **Sora** for body/UI via Google Fonts.
- Add a global SVG-noise grain overlay at 3% opacity (fixed, pointer-events-none).
- New shadow tokens: warm-tinted (`0 20px 60px -20px rgba(232,168,124,.18)`) instead of black.
- Editorial type scale (display / serif-italic accents on numbers like streak counts and day numbers).

**Component pass**
- Rebuild Button, Card, Slider variants to match (no more flat gray cards).
- New primitives: `<DisplayHeading>` (Fraunces), `<StatNumber>` (Fraunces italic), `<GrainOverlay>`, `<WarmCard>` with layered soft glow.
- Landing, login, dashboard, onboarding, track detail, insights, settings all re-skinned with the new system. Mix full-bleed sections + overlapping elements on dashboard and track detail (no uniform card grid).

**Micro-interactions**
- Spring-physics progress ring on track detail (Framer Motion).
- Particle burst on day completion (lightweight canvas, ~40 particles, amber/terracotta).
- Breathing pulse on the check-in submit button while the AI streams.
- Page transitions: subtle fade + 8px rise.

**Identity framing (cheap to add, huge payoff)**
- After 21 days on a track, the dashboard headline shifts from "Day 21" to "You are someone who {verb}s." Stored as a derived state from `journeys.day_number` — no schema change.

---

## Phase 2 — Mood/energy, Shields, Science library, Weekly Letter, Relapse protocol (next turn)

- **Mood & energy**: extend `track_logs` (already has `mood`) with `energy int`; add pre-check-in slider step; AI prompt updated to correlate patterns.
- **Shields**: add `shields int default 0` to `user_tracks`; +1 per 7-day streak; spend to protect a missed day. Replaces the existing `freezes_remaining` field (rename + UI).
- **Science library**: new `science_cards` table (track_id, title, body, sort). Seed 10 cards for each of the 50 tracks via one AI generation pass on first view (cached). Editorial card layout.
- **Weekly AI letter**: rework `insights` content prompt to write a warm personal letter (not a report). Sunday auto-generate via pg_cron + `/api/public/hooks/weekly-letter`.
- **Relapse protocol**: new "I relapsed" button on addiction-category tracks → dedicated flow (trigger analysis → 24h re-entry plan → research citation), no streak shame.

---

## Phase 3 — Voice check-ins, Community, Partner mode, Body map, Transformation artifacts, Legacy journal, Paywall (turn after)

- **Voice check-ins**: ElevenLabs scribe_v2 batch transcription via server fn; store transcript + emotion analysis.
- **Anonymous community**: `community_posts` table (user_id, track_id, day_number, sentence). No likes, no follows. Chronological feed per track.
- **Partner mode**: `partners` table; invite link; partner sees streak + mood trend only; 1 message/day.
- **Body map**: SVG silhouette, highlight regions from active tracks (static mapping table in code).
- **Transformation artifacts**: AI-generated illustrated cards at milestone days (gpt-image/gemini-image), saved to storage, gallery view.
- **Legacy journal**: end-of-journey PDF via the docx/pdf skill, narrative composed by AI from all check-ins.
- **Paywall**: `subscriptions` table; gate voice/letter/partner/library/journal behind Pro; elegant unlock UI. Stripe wiring deferred to a follow-up so we can pick provider properly.

---

## Cinematic onboarding (folded into Phase 1)

First-open flow gets replaced: single full-bleed question "What is the one thing that, if you changed it, would change everything?" → free text → AI suggests one track from the 50 → user commits. Existing multi-select onboarding becomes a secondary "add more tracks" flow.

---

## What I will NOT do without confirmation

- Add Stripe/Paddle (Phase 3 includes paywall UI but real billing needs the payments workflow).
- Send real push notifications (still deferred — requires native shell or web-push setup).
- Add background image generation for every milestone proactively (expensive); generated on unlock instead.

Approve and I'll ship Phase 1 now.
