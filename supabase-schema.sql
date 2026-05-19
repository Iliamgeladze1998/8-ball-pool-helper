-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Goal members table (for collaboration)
CREATE TABLE public.goal_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(goal_id, user_id)
);

-- Goal suggestions table (AI-generated suggestions)
CREATE TABLE public.goal_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  suggested_to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(goal_id, suggested_to_user_id)
);

-- Indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_tags ON public.goals USING GIN(tags);
CREATE INDEX idx_goal_members_goal_id ON public.goal_members(goal_id);
CREATE INDEX idx_goal_members_user_id ON public.goal_members(user_id);
CREATE INDEX idx_goal_suggestions_goal_id ON public.goal_suggestions(goal_id);
CREATE INDEX idx_goal_suggestions_user_id ON public.goal_suggestions(suggested_to_user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_suggestions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Goals policies
CREATE POLICY "Users can view all goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Users can create goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal members policies
CREATE POLICY "Users can view goal members" ON public.goal_members FOR SELECT USING (true);
CREATE POLICY "Users can join goals" ON public.goal_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goal owners can manage members" ON public.goal_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = goal_members.goal_id 
    AND goals.user_id = auth.uid()
  )
);

-- Goal suggestions policies
CREATE POLICY "Users can view own suggestions" ON public.goal_suggestions FOR SELECT USING (auth.uid() = suggested_to_user_id);
CREATE POLICY "System can create suggestions" ON public.goal_suggestions FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for goals table
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add goal owner as member
CREATE OR REPLACE FUNCTION add_goal_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.goal_members (goal_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic owner membership
CREATE TRIGGER add_owner_to_goal_members
  AFTER INSERT ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION add_goal_owner_as_member();
