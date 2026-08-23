import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const HOLD_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { seatIds, showId } = await req.json()
    if (!seatIds?.length || !showId) {
      return NextResponse.json({ error: 'seatIds and showId are required' }, { status: 400 })
    }

    // Release expired holds first
    await db.seat.updateMany({
      where: {
        status: 'HELD',
        heldAt: { lt: new Date(Date.now() - HOLD_TTL_MS) }
      },
      data: { status: 'AVAILABLE', heldBy: null, heldAt: null }
    })

    // Use atomic transaction - find available seats and hold them
    const availableSeats = await db.seat.findMany({
      where: {
        id: { in: seatIds },
        showId,
        status: 'AVAILABLE'
      }
    })

    if (availableSeats.length !== seatIds.length) {
      const heldOrBooked = seatIds.length - availableSeats.length
      return NextResponse.json({
        error: `${heldOrBooked} seat(s) are no longer available. Please refresh and try again.`,
        availableCount: availableSeats.length
      }, { status: 409 })
    }

    // Hold all seats atomically
    const result = await db.seat.updateMany({
      where: {
        id: { in: availableSeats.map(s => s.id) },
        status: 'AVAILABLE' // double-check within the update
      },
      data: {
        status: 'HELD',
        heldBy: user.id,
        heldAt: new Date()
      }
    })

    if (result.count !== seatIds.length) {
      // Some seats were taken between our check and update - release any we did hold
      return NextResponse.json({
        error: 'Some seats were taken by another user. Please refresh and try again.'
      }, { status: 409 })
    }

    const heldSeats = await db.seat.findMany({
      where: { id: { in: seatIds } },
      include: { seatCategory: true }
    })

    return NextResponse.json({ success: true, seats: heldSeats })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to hold seats'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
