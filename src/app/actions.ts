'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { analyzeAndSuggestGoals, getSuggestionsForUser as aiGetSuggestionsForUser } from '@/lib/ai-agent'
import { revalidatePath } from 'next/cache'

export async function createGoal(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const tags = formData.get('tags') as string
  const targetDate = formData.get('targetDate') as string
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : []
  
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      description,
      tags: tagsArray,
      target_date: targetDate || null,
      progress: 0,
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true, data }
}

export async function updateGoalProgress(goalId: string, progress: number) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('goals')
    .update({ 
      progress,
      status: progress >= 100 ? 'completed' : 'active'
    })
    .eq('id', goalId)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true, data }
}

export async function joinGoal(goalId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('goal_members')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      role: 'member'
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true, data }
}

export async function leaveGoal(goalId: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { error } = await supabase
    .from('goal_members')
    .delete()
    .eq('goal_id', goalId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true }
}

export async function getGoals() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      goal_members (
        user_id,
        role,
        users (
          username
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true, data }
}

export async function getUserProfile() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true, data }
}

export async function updateUserProfile(interests: string[]) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('users')
    .update({ interests })
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true, data }
}

export async function analyzeGoal(goalId: string) {
  const result = await analyzeAndSuggestGoals(goalId)
  return { success: true, data: result }
}

export async function getSuggestionsForUser() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }
  
  const result = await aiGetSuggestionsForUser(user.id)
  return result
}
