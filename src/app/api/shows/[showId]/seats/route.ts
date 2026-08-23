import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ showId: string }> }
) {
  try {
    const { showId } = await params
    const show = await db.show.findUnique({
      where: { id: showId },
      include: {
        event: {
          include: {
            venue: { include: { seatCategories: true } },
            eventPricings: { include: { seatCategory: true } }
          }
        }
      }
    })

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    const seats = await db.seat.findMany({
      where: { showId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      include: { seatCategory: true }
    })

    return NextResponse.json({ show, seats })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch seats'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
