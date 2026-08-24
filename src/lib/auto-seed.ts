import { db } from './db'
import { hash } from 'bcryptjs'

let seeded = false

export async function seedIfEmpty() {
  if (seeded) return
  try {
    const count = await db.event.count()
    if (count > 0) { seeded = true; return }

    console.log('Auto-seeding database...')

    const adminPass = await hash('admin123', 10)
    const orgPass = await hash('org123', 10)
    const custPass = await hash('cust123', 10)

    const admin = await db.user.create({
      data: { email: 'admin@ticketbox.com', name: 'Admin User', password: adminPass, role: 'ADMIN' }
    })
    const organiser = await db.user.create({
      data: { email: 'organiser@ticketbox.com', name: 'Event Organiser', password: orgPass, role: 'ORGANISER' }
    })
    const customer1 = await db.user.create({
      data: { email: 'john@example.com', name: 'John Smith', password: custPass, role: 'CUSTOMER' }
    })
    const customer2 = await db.user.create({
      data: { email: 'jane@example.com', name: 'Jane Doe', password: custPass, role: 'CUSTOMER' }
    })

    const venue1 = await db.venue.create({
      data: { name: 'Grand Cinema Hall', location: 'Downtown Entertainment District', totalRows: 10, seatsPerRow: 12, layout: JSON.stringify([]), createdById: admin.id }
    })
    const premium1 = await db.seatCategory.create({ data: { venueId: venue1.id, name: 'Premium', color: '#DC2626', startRow: 1, endRow: 3, priceMultiplier: 2.5 } })
    const standard1 = await db.seatCategory.create({ data: { venueId: venue1.id, name: 'Standard', color: '#F59E0B', startRow: 4, endRow: 7, priceMultiplier: 1.5 } })
    const economy1 = await db.seatCategory.create({ data: { venueId: venue1.id, name: 'Economy', color: '#10B981', startRow: 8, endRow: 10, priceMultiplier: 1.0 } })

    const venue2 = await db.venue.create({
      data: { name: 'Starlight Arena', location: 'Harbor Front Complex', totalRows: 15, seatsPerRow: 20, layout: JSON.stringify([]), createdById: admin.id }
    })
    const vip2 = await db.seatCategory.create({ data: { venueId: venue2.id, name: 'VIP', color: '#7C3AED', startRow: 1, endRow: 3, priceMultiplier: 3.0 } })
    const premium2 = await db.seatCategory.create({ data: { venueId: venue2.id, name: 'Premium', color: '#DC2626', startRow: 4, endRow: 8, priceMultiplier: 2.0 } })
    const general2 = await db.seatCategory.create({ data: { venueId: venue2.id, name: 'General', color: '#3B82F6', startRow: 9, endRow: 15, priceMultiplier: 1.0 } })

    const event1 = await db.event.create({
      data: { title: 'Inception: The Dream Within', description: 'Experience Christopher Nolan\'s mind-bending masterpiece on the big screen. A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster. Don\'t miss this immersive cinematic experience with enhanced visuals and sound.', type: 'MOVIE', image: '/inception.jpg', venueId: venue1.id, organiserId: organiser.id }
    })
    const event2 = await db.event.create({
      data: { title: 'The Midnight Orchestra', description: 'An unforgettable evening of classical and contemporary music performed by the world-renowned Midnight Orchestra. Featuring a repertoire spanning from Beethoven to modern film scores, this concert promises to take you on an emotional journey through the power of live orchestral performance. Special guest soloist Maria Chen joins for Vivaldi\'s Four Seasons.', type: 'CONCERT', image: '/orchestra.jpg', venueId: venue2.id, organiserId: organiser.id }
    })
    const event3 = await db.event.create({
      data: { title: 'Dune: Part Three - The Prophet', description: 'The epic conclusion to Denis Villeneuve\'s monumental Dune trilogy. Paul Atreides must navigate the treacherous politics of the galactic empire while confronting his destiny as the prophesied leader. With stunning visuals and a powerful score by Hans Zimmer, this is the cinematic event of the decade.', type: 'MOVIE', image: '/dune.jpg', venueId: venue1.id, organiserId: organiser.id }
    })
    const event4 = await db.event.create({
      data: { title: 'Aurora Beats - Live Electronic', description: 'The hottest electronic music festival of the year featuring international DJs and stunning visual effects. From deep house to techno, experience an electrifying night of non-stop music and light shows. Lineup includes DJ Nexus, Synthwave Collective, and special international guest performers.', type: 'CONCERT', image: '/aurora.jpg', venueId: venue2.id, organiserId: organiser.id }
    })

    await db.eventPricing.createMany({
      data: [
        { eventId: event1.id, seatCategoryId: premium1.id, price: 750 }, { eventId: event1.id, seatCategoryId: standard1.id, price: 450 }, { eventId: event1.id, seatCategoryId: economy1.id, price: 300 },
        { eventId: event2.id, seatCategoryId: vip2.id, price: 2000 }, { eventId: event2.id, seatCategoryId: premium2.id, price: 1200 }, { eventId: event2.id, seatCategoryId: general2.id, price: 600 },
        { eventId: event3.id, seatCategoryId: premium1.id, price: 800 }, { eventId: event3.id, seatCategoryId: standard1.id, price: 500 }, { eventId: event3.id, seatCategoryId: economy1.id, price: 350 },
        { eventId: event4.id, seatCategoryId: vip2.id, price: 2500 }, { eventId: event4.id, seatCategoryId: premium2.id, price: 1500 }, { eventId: event4.id, seatCategoryId: general2.id, price: 750 },
      ]
    })

    const showDates = [
      { event: event1, dates: ['2026-09-01', '2026-09-02', '2026-09-03'], times: ['14:00', '18:00', '21:30'] },
      { event: event2, dates: ['2026-09-05', '2026-09-06'], times: ['19:00', '21:00'] },
      { event: event3, dates: ['2026-09-10', '2026-09-11', '2026-09-12'], times: ['15:00', '19:30', '22:00'] },
      { event: event4, dates: ['2026-09-15', '2026-09-16'], times: ['20:00', '23:00'] },
    ]

    const allShows: any[] = []
    for (const sd of showDates) {
      const venue = sd.event.venueId === venue1.id ? venue1 : venue2
      const categories = await db.seatCategory.findMany({ where: { venueId: venue.id } })
      for (const date of sd.dates) {
        for (const time of sd.times) {
          const show = await db.show.create({ data: { eventId: sd.event.id, date, time } })
          allShows.push(show)
          const seatData: any[] = []
          for (let row = 1; row <= venue.totalRows; row++) {
            const cat = categories.find((c: any) => row >= c.startRow && row <= c.endRow)!
            for (let num = 1; num <= venue.seatsPerRow; num++) {
              seatData.push({ showId: show.id, row, number: num, seatCategoryId: cat.id, status: 'AVAILABLE' as const })
            }
          }
          for (let i = 0; i < seatData.length; i += 500) {
            await db.seat.createMany({ data: seatData.slice(i, i + 500) })
          }
        }
      }
    }

    // Sample bookings
    const firstShow = allShows[0]
    const firstShowSeats = await db.seat.findMany({ where: { showId: firstShow.id, status: 'AVAILABLE' }, take: 2 })
    if (firstShowSeats.length >= 2) {
      const p1 = await db.eventPricing.findFirst({ where: { eventId: firstShow.eventId, seatCategoryId: firstShowSeats[0].seatCategoryId } })
      const p2 = await db.eventPricing.findFirst({ where: { eventId: firstShow.eventId, seatCategoryId: firstShowSeats[1].seatCategoryId } })
      const total = (p1?.price ?? 0) + (p2?.price ?? 0)
      const ref = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      const booking = await db.booking.create({ data: { userId: customer1.id, showId: firstShow.id, totalAmount: total, status: 'CONFIRMED', bookingRef: ref } })
      await db.bookingSeat.createMany({ data: [{ bookingId: booking.id, seatId: firstShowSeats[0].id, price: p1?.price ?? 0 }, { bookingId: booking.id, seatId: firstShowSeats[1].id, price: p2?.price ?? 0 }] })
      await db.seat.updateMany({ where: { id: { in: firstShowSeats.map((s: any) => s.id) } }, data: { status: 'BOOKED', bookedBy: customer1.id } })
    }

    const secondShow = allShows[1]
    const secondShowSeats = await db.seat.findMany({ where: { showId: secondShow.id, status: 'AVAILABLE' }, take: 8 })
    if (secondShowSeats.length >= 8) {
      const ref2 = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      const prices = await Promise.all(secondShowSeats.map((s: any) => db.eventPricing.findFirst({ where: { eventId: secondShow.eventId, seatCategoryId: s.seatCategoryId } })))
      const total2 = prices.reduce((sum: number, p: any) => sum + (p?.price ?? 0), 0)
      const booking2 = await db.booking.create({ data: { userId: customer2.id, showId: secondShow.id, totalAmount: total2, status: 'CONFIRMED', bookingRef: ref2 } })
      await db.bookingSeat.createMany({ data: secondShowSeats.map((s: any, i: number) => ({ bookingId: booking2.id, seatId: s.id, price: prices[i]?.price ?? 0 })) })
      await db.seat.updateMany({ where: { id: { in: secondShowSeats.map((s: any) => s.id) } }, data: { status: 'BOOKED', bookedBy: customer2.id } })
    }

    seeded = true
    console.log('Auto-seed complete!')
  } catch (e) {
    console.error('Auto-seed failed:', e)
  }
}
