import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [totalEvents, totalBookings, totalUsers, totalRevenue] = await Promise.all([
      db.event.count(),
      db.booking.count({ where: { status: 'CONFIRMED' } }),
      db.user.count(),
      db.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true }
      })
    ])

    const recentBookings = await db.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        show: { include: { event: { select: { title: true } } } }
      }
    })

    return NextResponse.json({
      stats: {
        totalEvents,
        totalBookings,
        totalUsers,
        totalRevenue: totalRevenue._sum.totalAmount ?? 0
      },
      recentBookings
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch summary'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
