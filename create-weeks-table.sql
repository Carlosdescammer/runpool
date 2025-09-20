-- Create the weeks table for weekly challenges
-- Copy and paste this into the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/ffudsetxraiqzoynkbrb/sql/

-- Create weeks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.weeks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  distance_goal_km DECIMAL(10,2) NOT NULL,
  entry_fee_cents INTEGER NOT NULL, -- Amount in cents to avoid floating point issues
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, week_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weeks_group_id ON public.weeks(group_id);
CREATE INDEX IF NOT EXISTS idx_weeks_status ON public.weeks(status);
CREATE INDEX IF NOT EXISTS idx_weeks_dates ON public.weeks(start_date, end_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view weeks for groups they're members of
CREATE POLICY "Users can view weeks for their groups"
ON public.weeks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE group_id = weeks.group_id
    AND user_id = auth.uid()
  )
);

-- Group admins can manage weeks
CREATE POLICY "Group admins can manage weeks"
ON public.weeks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE group_id = weeks.group_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Update trigger
CREATE TRIGGER update_weeks_updated_at
BEFORE UPDATE ON public.weeks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();