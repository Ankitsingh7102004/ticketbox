import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await db.event.findUnique({
      where: { id },
      include: {
        venue: {
          include: { seatCategories: true }
        },
        shows: {
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          include: {
            _count: {
              select: {
                seats: { where: { status: 'AVAILABLE' } },
                bookings: true
              }
            }
          }
        },
        eventPricings: {
          include: { seatCategory: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch event'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
