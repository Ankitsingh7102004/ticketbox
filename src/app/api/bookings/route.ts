import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const bookings = await db.booking.findMany({
      where: { userId: user.id },
      include: {
        show: {
          include: {
            event: { include: { venue: true } }
          }
        },
        bookingSeats: {
          include: { seat: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ bookings })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch bookings'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

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

    // Verify seats are held by this user
    const heldSeats = await db.seat.findMany({
      where: {
        id: { in: seatIds },
        showId,
        status: 'HELD',
        heldBy: user.id
      },
      include: { seatCategory: true }
    })

    if (heldSeats.length !== seatIds.length) {
      return NextResponse.json({ error: 'Some seats are no longer held by you' }, { status: 409 })
    }

    // Get pricing
    const show = await db.show.findUnique({
      where: { id: showId },
      include: { event: { include: { eventPricings: true } } }
    })
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    let totalAmount = 0
    const bookingSeatsData = heldSeats.map(seat => {
      const pricing = show.event.eventPricings.find(
        p => p.seatCategoryId === seat.seatCategoryId
      )
      const price = pricing?.price ?? 0
      totalAmount += price
      return { seatId: seat.id, price }
    })

    const bookingRef = 'TKT-' + randomUUID().split('-')[0].toUpperCase()

    const booking = await db.booking.create({
      data: {
        userId: user.id,
        showId,
        totalAmount,
        status: 'CONFIRMED',
        bookingRef,
        bookingSeats: {
          create: bookingSeatsData
        }
      },
      include: {
        show: {
          include: {
            event: { include: { venue: true } }
          }
        },
        bookingSeats: {
          include: {
            seat: { include: { seatCategory: true } }
          }
        }
      }
    })

    // Mark seats as booked
    await db.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'BOOKED', bookedBy: user.id, heldBy: null, heldAt: null }
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
