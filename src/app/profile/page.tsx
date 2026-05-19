'use client'

import { useState, useEffect } from 'react'
import { getUserProfile, updateUserProfile } from '../actions'
import { createClient } from '@/lib/supabase'

const INTEREST_OPTIONS = [
  'fitness', 'learning', 'career', 'finance', 
  'creativity', 'lifestyle', 'social', 'technology',
  'health', 'business', 'art', 'music', 'travel',
  'cooking', 'reading', 'gaming', 'sports'
]

export default function ProfilePage() {
  const [interests, setInterests] = useState<string[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await (supabase as any).auth.getUser()
    
    if (authUser) {
      setUser(authUser)
      const result = await getUserProfile()
      if (result.success && result.data) {
        setInterests(result.data.interests || [])
        setUsername(result.data.username || '')
      }
    }
    
    setLoading(false)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    const result = await updateUserProfile(interests)
    
    if (result.success) {
      setMessage('Profile updated successfully!')
    } else {
      setMessage('Failed to update profile')
    }
    
    setSaving(false)
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
          <p className="text-zinc-600">Please sign in to view your profile</p>
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
            <a href="/suggestions" className="text-sm text-zinc-600 hover:text-zinc-900">Suggestions</a>
            <a href="/profile" className="text-sm text-zinc-900 font-medium">Profile</a>
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

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Your Profile</h2>
        <p className="text-zinc-600 mb-8">Manage your interests to get better goal recommendations</p>

        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1">Username is managed by your account</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-3">
              Your Interests
            </label>
            <p className="text-sm text-zinc-600 mb-4">
              Select interests that match your goals. Our AI will use these to suggest relevant goals from other users.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    interests.includes(interest)
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('success') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How AI Suggestions Work</h3>
          <p className="text-sm text-blue-800">
            Our AI analyzes the goals you create and matches them with other users who have similar interests. 
            When you create a goal, it's automatically suggested to users with matching interests. 
            Update your interests to improve the quality of recommendations you receive.
          </p>
        </div>
      </main>
    </div>
  )
}
