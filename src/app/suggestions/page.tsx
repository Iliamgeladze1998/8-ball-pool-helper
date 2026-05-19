'use client'

import { useState, useEffect } from 'react'
import { getSuggestionsForUser } from '../actions'
import { joinGoal } from '../actions'
import { createClient } from '@/lib/supabase'

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await (supabase as any).auth.getUser()
    
    if (authUser) {
      setUser(authUser)
      const result = await getSuggestionsForUser()
      if (result.success && result.data) {
        setSuggestions(result.data)
      }
    }
    
    setLoading(false)
  }

  const handleJoinGoal = async (goalId: string) => {
    await joinGoal(goalId)
    // Reload suggestions to remove joined goals
    loadSuggestions()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400">Loading suggestions...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-zinc-600">Please sign in to view suggestions</p>
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
            <a href="/" className="text-sm text-zinc-600 hover:text-zinc-900">Goals</a>
            <a href="/suggestions" className="text-sm text-zinc-900 font-medium">Suggestions</a>
            <a href="/profile" className="text-sm text-zinc-600 hover:text-zinc-900">Profile</a>
            <span className="text-sm text-zinc-600">{user.email}</span>
            <button 
              onClick={() => {
                const supabase = createClient()
                ;(supabase as any).auth.signOut()
                window.location.href = '/'
              }}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Recommended Goals</h2>
        <p className="text-zinc-600 mb-8">Goals matched to your interests by our AI</p>

        {suggestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-zinc-200">
            <div className="text-zinc-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-zinc-600 mb-2">No suggestions yet</p>
            <p className="text-sm text-zinc-500">Create goals and update your interests to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onJoin={handleJoinGoal}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function SuggestionCard({ suggestion, onJoin }: any) {
  const goal = suggestion.goals
  const matchScore = suggestion.match_score
  const reason = suggestion.reason

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-zinc-900">{goal.title}</h3>
            <span className="px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded-full">
              {matchScore}% match
            </span>
          </div>
          {goal.description && (
            <p className="text-sm text-zinc-600 mb-2">{goal.description}</p>
          )}
          <p className="text-xs text-zinc-500 italic">{reason}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-600">Progress</span>
          <span className="text-sm font-medium text-zinc-900">{goal.progress}%</span>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div
            className="bg-zinc-900 h-2 rounded-full transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
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

      {/* Goal Owner */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-zinc-600">
              {goal.users?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm text-zinc-600">
            by {goal.users?.username || 'Anonymous'}
          </span>
        </div>
        
        <button
          onClick={() => onJoin(goal.id)}
          className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
        >
          Join Goal
        </button>
      </div>
    </div>
  )
}
