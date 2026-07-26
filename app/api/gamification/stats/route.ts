import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GamificationService } from '@/lib/gamification'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await GamificationService.getUserStats(session.user.id)
    
    if (!stats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching gamification stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, points, context } = await request.json()

    let result = null

    switch (action) {
      case 'award_points':
        result = await GamificationService.awardPoints(
          session.user.id, 
          points, 
          context?.reason || 'Manual points award'
        )
        break
      
      case 'update_streak':
        result = await GamificationService.updateStreak(session.user.id)
        break
      
      case 'check_achievements':
        result = await GamificationService.checkAndAwardAchievements(
          session.user.id, 
          context
        )
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error processing gamification action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}