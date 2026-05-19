export interface User {
  id: string
  email: string
  username: string
  interests: string[]
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  target_date?: string
  progress: number
  status: 'active' | 'completed' | 'paused'
  tags: string[]
  created_at: string
  updated_at: string
}

export interface GoalMember {
  id: string
  goal_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface GoalSuggestion {
  goal_id: string
  suggested_to_user_id: string
  match_score: number
  reason: string
  created_at: string
}
