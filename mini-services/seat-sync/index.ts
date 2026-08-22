import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: 'file:../../db/custom.db'
})

const io = new Server({
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000
})

const HOLD_TTL_MS = 10 * 60 * 1000

// Run expired hold cleanup every 30 seconds
setInterval(async () => {
  try {
    const expired = await prisma.seat.findMany({
      where: {
        status: 'HELD',
        heldAt: { lt: new Date(Date.now() - HOLD_TTL_MS) }
      }
    })

    if (expired.length > 0) {
      const ids = expired.map(s => s.id)
      await prisma.seat.updateMany({
        where: { id: { in: ids } },
        data: { status: 'AVAILABLE', heldBy: null, heldAt: null }
      })

      // Group by showId for broadcasting
      const byShow = new Map<string, typeof expired>()
      for (const seat of expired) {
        const list = byShow.get(seat.showId) || []
        list.push(seat)
        byShow.set(seat.showId, list)
      }

      for (const [showId, seats] of byShow) {
        io.to(`show:${showId}`).emit('seats-updated', {
          showId,
          seats: seats.map(s => ({
            id: s.id,
            row: s.row,
            number: s.number,
            status: 'AVAILABLE'
          }))
        })
      }

      console.log(`Released ${expired.length} expired holds`)
    }
  } catch (e) {
    console.error('Hold cleanup error:', e)
  }
}, 30000)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-show', (showId: string) => {
    socket.join(`show:${showId}`)
    console.log(`Socket ${socket.id} joined show ${showId}`)
  })

  socket.on('leave-show', (showId: string) => {
    socket.leave(`show:${showId}`)
  })

  socket.on('seat-update', (data: { showId: string; seats: Array<{ id: string; status: string }> }) => {
    io.to(`show:${data.showId}`).emit('seats-updated', {
      showId: data.showId,
      seats: data.seats
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

io.listen(3003)
console.log('Seat sync service running on port 3003')