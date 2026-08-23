import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}
    if (type && type !== 'ALL') where.type = type
    if (search) where.title = { contains: search }

    const events = await db.event.findMany({
      where,
      include: {
        venue: true,
        eventPricings: { include: { seatCategory: true }, orderBy: { price: 'asc' }, take: 1 },
        shows: {
          where: date ? { date: { gte: date } } : { date: { gte: new Date().toISOString().split('T')[0] } },
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          take: 5,
          include: {
            _count: { select: { seats: { where: { status: 'AVAILABLE' } }, bookings: true } }
          }
        },
        _count: { select: { shows: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ events })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch events'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await (await import('@/lib/auth')).getCurrentUser()
    if (!user || (user.role !== 'ORGANISER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const event = await db.event.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        image: body.image || '/placeholder.jpg',
        venueId: body.venueId,
        organiserId: user.id,
      },
      include: { venue: true }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create event'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}