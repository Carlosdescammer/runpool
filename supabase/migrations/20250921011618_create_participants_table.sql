-- Create participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID REFERENCES public.weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id, user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_participants_week_id ON public.participants(week_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own participations" ON public.participants;
CREATE POLICY "Users can view their own participations"
  ON public.participants
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own participations" ON public.participants;
CREATE POLICY "Users can insert their own participations"
  ON public.participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participations" ON public.participants;
CREATE POLICY "Users can update their own participations"
  ON public.participants
  FOR UPDATE
  USING (auth.uid() = user_id);