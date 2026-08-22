import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { showId, seatCategoryId } = await req.json()
    if (!showId || !seatCategoryId) {
      return NextResponse.json({ error: 'showId and seatCategoryId are required' }, { status: 400 })
    }

    // Check if already on waitlist
    const existing = await db.waitlist.findFirst({
      where: { userId: user.id, showId, seatCategoryId, status: 'WAITING' }
    })
    if (existing) {
      return NextResponse.json({ error: 'Already on waitlist for this category' }, { status: 400 })
    }

    const waitlist = await db.waitlist.create({
      data: { userId: user.id, showId, seatCategoryId }
    })

    return NextResponse.json({ waitlist }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to join waitlist'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const waitlists = await db.waitlist.findMany({
      where: { userId: user.id },
      include: {
        show: { include: { event: true } },
        seatCategory: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ waitlists })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch waitlist'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
