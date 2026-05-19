import { NextResponse } from 'next/server'
import { analyzeGoal } from '../../actions'

export async function POST(request: Request) {
  try {
    const { goalId } = await request.json()
    
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 })
    }
    
    const result = await analyzeGoal(goalId)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze goal' }, { status: 500 })
  }
}
