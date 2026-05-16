
CREATE TABLE public.journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_track_id uuid NOT NULL UNIQUE,
  total_days integer NOT NULL,
  starting_point text NOT NULL,
  motivation text NOT NULL DEFAULT '',
  obstacle text NOT NULL DEFAULT '',
  generated_through integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY j_select_own ON public.journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY j_insert_own ON public.journeys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY j_update_own ON public.journeys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY j_delete_own ON public.journeys FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.journey_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  task text NOT NULL,
  reflection text NOT NULL,
  science text NOT NULL,
  checkin_prompt text NOT NULL,
  completed_at timestamptz,
  user_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, day_number)
);
CREATE INDEX journey_days_journey_idx ON public.journey_days(journey_id, day_number);
ALTER TABLE public.journey_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY jd_select_own ON public.journey_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY jd_insert_own ON public.journey_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY jd_update_own ON public.journey_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY jd_delete_own ON public.journey_days FOR DELETE USING (auth.uid() = user_id);
