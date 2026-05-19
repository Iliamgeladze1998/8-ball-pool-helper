'use client'

import { useState, useEffect } from 'react'
import { createGoal, updateGoalProgress, joinGoal, getGoals, getUserProfile, analyzeGoal } from './actions'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const [goals, setGoals] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  useEffect(() => {
    loadUserAndGoals()
  }, [])

  const loadUserAndGoals = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await (supabase as any).auth.getUser()
    
    if (authUser) {
      setUser(authUser)
      
      // Check if user profile exists, create if not
      const profileResult = await getUserProfile()
      if (profileResult.error) {
        // Create basic profile
        await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.email?.split('@')[0] || 'user',
          interests: []
        })
      }
      
      const goalsResult = await getGoals()
      if (goalsResult.success && goalsResult.data) {
        setGoals(goalsResult.data)
      }
    }
    
    setLoading(false)
  }

  const handleCreateGoal = async (formData: FormData) => {
    const result = await createGoal(formData)
    if (result.success) {
      setShowCreateForm(false)
      
      // Trigger AI analysis
      if (result.data?.id) {
        await analyzeGoal(result.data.id)
      }
      
      const goalsResult = await getGoals()
      if (goalsResult.success && goalsResult.data) {
        setGoals(goalsResult.data)
      }
    }
  }

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    await updateGoalProgress(goalId, progress)
    const goalsResult = await getGoals()
    if (goalsResult.success && goalsResult.data) {
      setGoals(goalsResult.data)
    }
  }

  const handleJoinGoal = async (goalId: string) => {
    await joinGoal(goalId)
    const goalsResult = await getGoals()
    if (goalsResult.success && goalsResult.data) {
      setGoals(goalsResult.data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-4">Tribe-Sync</h1>
          <p className="text-zinc-600 mb-6">Collaborative Goal Achievement</p>
          <button 
            onClick={() => {
              const supabase = createClient()
              ;(supabase as any).auth.signInWithOAuth({ provider: 'google' })
            }}
            className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Tribe-Sync</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-zinc-900 font-medium">Goals</a>
            <a href="/suggestions" className="text-sm text-zinc-600 hover:text-zinc-900">Suggestions</a>
            <a href="/profile" className="text-sm text-zinc-600 hover:text-zinc-900">Profile</a>
            <span className="text-sm text-zinc-600">{user.email}</span>
            <button 
              onClick={() => {
                const supabase = createClient()
                ;(supabase as any).auth.signOut()
                window.location.reload()
              }}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900">Your Goals</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
          >
            {showCreateForm ? 'Cancel' : 'New Goal'}
          </button>
        </div>

        {showCreateForm && (
          <CreateGoalForm onSubmit={handleCreateGoal} onCancel={() => setShowCreateForm(false)} />
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              No goals yet. Create your first goal to get started.
            </div>
          ) : (
            goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currentUserId={user.id}
                onUpdateProgress={handleUpdateProgress}
                onJoin={handleJoinGoal}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

function CreateGoalForm({ onSubmit, onCancel }: { onSubmit: (formData: FormData) => void, onCancel: () => void }) {
  return (
    <form action={onSubmit} className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Goal Title</label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g., Run a marathon"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
          <textarea
            name="description"
            placeholder="Describe your goal..."
            rows={3}
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            placeholder="e.g., fitness, health, running"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Target Date (optional)</label>
          <input
            type="date"
            name="targetDate"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

function GoalCard({ goal, currentUserId, onUpdateProgress, onJoin }: any) {
  const [localProgress, setLocalProgress] = useState(goal.progress)
  const isOwner = goal.user_id === currentUserId
  const members = goal.goal_members || []
  const isMember = members.some((m: any) => m.user_id === currentUserId)

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setLocalProgress(value)
  }

  const handleProgressBlur = () => {
    onUpdateProgress(goal.id, localProgress)
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-zinc-600 mt-1">{goal.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          goal.status === 'completed' ? 'bg-green-100 text-green-800' :
          goal.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {goal.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-600">Progress</span>
          <span className="text-sm font-medium text-zinc-900">{localProgress}%</span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div
            className="bg-zinc-900 h-2 rounded-full transition-all"
            style={{ width: `${localProgress}%` }}
          />
        </div>
        {isOwner && (
          <input
            type="range"
            min="0"
            max="100"
            value={localProgress}
            onChange={handleProgressChange}
            onBlur={handleProgressBlur}
            className="w-full mt-2"
          />
        )}
      </div>

      {/* Tags */}
      {goal.tags && goal.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {goal.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Collaboration */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        
        {!isOwner && !isMember && (
          <button
            onClick={() => onJoin(goal.id)}
            className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
          >
            Join Goal
          </button>
        )}
        
        {isMember && !isOwner && (
          <span className="text-sm text-zinc-500">You're a member</span>
        )}
        
        {isOwner && (
          <span className="text-sm text-zinc-500">Owner</span>
        )}
      </div>
    </div>
  )
}
