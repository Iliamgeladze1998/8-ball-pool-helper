import { createServerSupabaseClient } from './supabase-server'

interface GoalMatch {
  goalId: string
  suggestedToUserId: string
  matchScore: number
  reason: string
}

// Keywords for different interest categories
const INTEREST_KEYWORDS: Record<string, string[]> = {
  fitness: ['exercise', 'workout', 'gym', 'run', 'fitness', 'health', 'weight', 'muscle', 'sport', 'yoga'],
  learning: ['learn', 'study', 'read', 'course', 'book', 'education', 'skill', 'language', 'programming'],
  career: ['job', 'career', 'business', 'startup', 'promotion', 'salary', 'professional', 'work'],
  finance: ['money', 'save', 'invest', 'budget', 'financial', 'debt', 'wealth', 'income'],
  creativity: ['write', 'draw', 'paint', 'music', 'art', 'create', 'design', 'photography'],
  lifestyle: ['travel', 'cook', 'home', 'garden', 'mindfulness', 'meditation', 'sleep'],
  social: ['meet', 'network', 'community', 'volunteer', 'help', 'mentor', 'friend']
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  return words.filter(word => word.length > 3)
}

function categorizeGoal(title: string, description: string, tags: string[]): string[] {
  const allText = `${title} ${description} ${tags.join(' ')}`
  const keywords = extractKeywords(allText)
  
  const categories: string[] = []
  
  for (const [category, categoryKeywords] of Object.entries(INTEREST_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => 
      categoryKeywords.some(ck => keyword.includes(ck) || ck.includes(keyword))
    ).length
    
    if (matchCount > 0) {
      categories.push(category)
    }
  }
  
  return categories.length > 0 ? categories : ['general']
}

function calculateMatchScore(
  goalCategories: string[],
  userInterests: string[]
): number {
  if (userInterests.length === 0) return 30 // Base score for new users
  
  const matchingInterests = goalCategories.filter(cat => 
    userInterests.some(interest => 
      interest.toLowerCase().includes(cat) || cat.includes(interest.toLowerCase())
    )
  )
  
  const baseScore = 40
  const matchBonus = matchingInterests.length * 20
  const maxScore = Math.min(baseScore + matchBonus, 95)
  
  return maxScore
}

function generateMatchReason(
  goalTitle: string,
  goalCategories: string[],
  userInterests: string[]
): string {
  const matchingInterests = goalCategories.filter(cat => 
    userInterests.some(interest => 
      interest.toLowerCase().includes(cat) || cat.includes(interest.toLowerCase())
    )
  )
  
  if (matchingInterests.length > 0) {
    return `This goal aligns with your interest in ${matchingInterests.join(', ')}`
  }
  
  return `This goal might interest you based on trending topics in your areas`
}

export async function analyzeAndSuggestGoals(goalId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get the goal details
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single()
  
  if (goalError || !goal) {
    console.error('Error fetching goal:', goalError)
    return
  }
  
  // Categorize the goal
  const categories = categorizeGoal(goal.title, goal.description || '', goal.tags || [])
  
  // Get all users except the goal creator
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, interests')
    .neq('id', goal.user_id)
  
  if (usersError || !users) {
    console.error('Error fetching users:', usersError)
    return
  }
  
  // Calculate matches and generate suggestions
  const matches: GoalMatch[] = []
  
  for (const user of users) {
    const userInterests = user.interests || []
    const matchScore = calculateMatchScore(categories, userInterests)
    const reason = generateMatchReason(goal.title, categories, userInterests)
    
    // Only suggest if match score is reasonable
    if (matchScore >= 50) {
      matches.push({
        goalId: goal.id,
        suggestedToUserId: user.id,
        matchScore,
        reason
      })
    }
  }
  
  // Insert suggestions into database
  for (const match of matches) {
    const { error: insertError } = await supabase
      .from('goal_suggestions')
      .insert({
        goal_id: match.goalId,
        suggested_to_user_id: match.suggestedToUserId,
        match_score: match.matchScore,
        reason: match.reason
      })
    
    // Ignore duplicate errors
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Error inserting suggestion:', insertError)
    }
  }
  
  return {
    goalCategories: categories,
    suggestionsGenerated: matches.length
  }
}

export async function getSuggestionsForUser(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('goal_suggestions')
    .select(`
      *,
      goals (
        id,
        title,
        description,
        tags,
        progress,
        status,
        users (
          username
        )
      )
    `)
    .eq('suggested_to_user_id', userId)
    .order('match_score', { ascending: false })
    .limit(10)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true, data }
}
