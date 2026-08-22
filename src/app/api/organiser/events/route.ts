import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'ORGANISER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Organiser access required' }, { status: 403 })
    }

    const where: Record<string, unknown> = {}
    if (user.role === 'ORGANISER') where.organiserId = user.id

    const events = await db.event.findMany({
      where,
      include: {
        venue: { select: { name: true, location: true } },
        shows: {
          include: {
            _count: { select: { bookings: true } }
          }
        },
        _count: { select: { shows: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate revenue per event
    const eventsWithRevenue = await Promise.all(events.map(async (event) => {
      const showIds = event.shows.map(s => s.id)
      const revenue = await db.booking.aggregate({
        where: { showId: { in: showIds }, status: 'CONFIRMED' },
        _sum: { totalAmount: true }
      })
      const totalBookings = await db.booking.count({
        where: { showId: { in: showIds }, status: 'CONFIRMED' }
      })
      return {
        ...event,
        revenue: revenue._sum.totalAmount ?? 0,
        totalBookings
      }
    }))

    return NextResponse.json({ events: eventsWithRevenue })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch events'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
