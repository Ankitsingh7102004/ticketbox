import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        bookingSeats: { include: { seat: true } },
        show: true
      }
    })

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })
    }

    // Cancel booking
    await db.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    // Release seats
    const seatIds = booking.bookingSeats.map(bs => bs.seatId)
    await db.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: 'AVAILABLE', bookedBy: null, heldBy: null, heldAt: null }
    })

    // Check waitlist for this show
    const showId = booking.showId
    const seatCategoryIds = [...new Set(booking.bookingSeats.map(bs => bs.seat.seatCategoryId))]

    for (const catId of seatCategoryIds) {
      // Find next waiting user for this category
      const nextInLine = await db.waitlist.findFirst({
        where: {
          showId,
          seatCategoryId: catId,
          status: 'WAITING'
        },
        orderBy: { createdAt: 'asc' }
      })

      if (nextInLine) {
        // Mark as offered
        await db.waitlist.update({
          where: { id: nextInLine.id },
          data: { status: 'OFFERED', offeredAt: new Date() }
        })

        // Find an available seat in this category
        const availableSeat = await db.seat.findFirst({
          where: { showId, seatCategoryId: catId, status: 'AVAILABLE' }
        })

        if (availableSeat) {
          // Auto-hold the seat for the waitlisted user
          await db.seat.update({
            where: { id: availableSeat.id },
            data: {
              status: 'HELD',
              heldBy: nextInLine.userId,
              heldAt: new Date()
            }
          })
        }
      }
    }

    // Check if show was sold out and should be reactivated
    const availableCount = await db.seat.count({
      where: { showId, status: 'AVAILABLE' }
    })
    if (availableCount > 0) {
      await db.show.update({
        where: { id: showId },
        data: { status: 'ACTIVE' }
      })
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to cancel booking'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
