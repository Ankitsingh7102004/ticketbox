import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { seatIds } = await req.json()
    if (!seatIds?.length) {
      return NextResponse.json({ error: 'seatIds are required' }, { status: 400 })
    }

    await db.seat.updateMany({
      where: {
        id: { in: seatIds },
        status: 'HELD',
        heldBy: user.id
      },
      data: { status: 'AVAILABLE', heldBy: null, heldAt: null }
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to release seats'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}