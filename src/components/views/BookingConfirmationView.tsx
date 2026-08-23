'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, Calendar, Clock, Ticket, ArrowRight, Download, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { QRTicket } from '@/components/QRTicket'
import { useRef } from 'react'

export function BookingConfirmationView() {
  const { lastBooking, navigate, clearSelection } = useAppStore()
  const ticketRef = useRef<HTMLDivElement>(null)

  const booking = lastBooking as any
  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No booking found.</p>
        <Button className="mt-4" onClick={() => navigate('home')}>
          Browse Events
        </Button>
      </div>
    )
  }

  const show = booking.show
  const event = show?.event
  const venue = event?.venue
  const bookingSeats = booking.bookingSeats ?? []
  const qrData = JSON.stringify({
    ref: booking.bookingRef,
    event: event?.title,
    date: show?.date,
    time: show?.time,
    venue: venue?.name,
    seats: bookingSeats.map((bs: any) => `R${bs.seat?.row}S${bs.seat?.number}`),
    amount: booking.totalAmount,
  })

  const handleDownloadTicket = () => {
    const el = ticketRef.current
    if (!el) return
    // Create a simple text-based ticket download
    const lines = [
      '═══════════════════════════════════════',
      '          TICKETBOX E-TICKET',
      '═══════════════════════════════════════',
      '',
      `Booking Ref: ${booking.bookingRef}`,
      '',
      `Event: ${event?.title}`,
      `Venue: ${venue?.name}, ${venue?.location}`,
      `Date: ${format(parseISO(show?.date), 'EEEE, MMMM d, yyyy')}`,
      `Time: ${show?.time}`,
      '',
      `Seats: ${bookingSeats.map((bs: any) => `Row ${bs.seat?.row}, Seat ${bs.seat?.number} (${bs.seat?.seatCategory?.name})`).join(' | ')}`,
      '',
      `Total Paid: $${booking.totalAmount?.toFixed(2)}`,
      '',
      `Booked on: ${format(parseISO(booking.createdAt), 'MMM d, yyyy HH:mm')}`,
      '',
      '═══════════════════════════════════════',
      '  Scan the QR code at the venue entrance',
      '═══════════════════════════════════════',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TicketBox-${booking.bookingRef}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDone = () => {
    clearSelection()
    navigate('my-bookings')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Success animation */}
      <motion.div
        className="flex flex-col items-center text-center mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </motion.div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Booking Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Your e-ticket with QR code has been generated. A confirmation email will be sent to your registered email.</p>
      </motion.div>

      {/* Ticket Card */}
      <motion.div
        ref={ticketRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden border-2">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Booking Reference</p>
                <p className="text-2xl font-bold font-mono mt-1">{booking.bookingRef}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Ticket className="h-6 w-6" />
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Event info + QR Code */}
            <div className="grid sm:grid-cols-[1fr,auto] gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold leading-tight">{event?.title}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {venue?.name}, {venue?.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {format(parseISO(show?.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    {show?.time}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-3 bg-white">
                  <QRTicket value={qrData} size={130} />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <QrCode className="h-3 w-3" />
                  Scan at venue
                </div>
              </div>
            </div>

            <Separator />

            {/* Seats */}
            <div>
              <p className="text-sm font-medium mb-2">Your Seats</p>
              <div className="flex flex-wrap gap-2">
                {bookingSeats.map((bs: any) => (
                  <Badge key={bs.id} variant="outline" className="text-sm px-3 py-1">
                    R{bs.seat?.row} · S{bs.seat?.number}
                    <span className="ml-1.5 text-muted-foreground">({bs.seat?.seatCategory?.name})</span>
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {bookingSeats.length} seat{bookingSeats.length !== 1 ? 's' : ''}
              </span>
              <span className="text-2xl font-bold">${booking.totalAmount?.toFixed(2)}</span>
            </div>
          </CardContent>

          {/* Dashed divider (tear-off style) */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-background" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-8 w-8 rounded-full bg-background" />
            <Separator className="border-dashed" />
          </div>

          <div className="px-6 pb-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Present this QR code at the venue entrance.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTicket}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button variant="outline" onClick={() => navigate('home')}>
          Browse More Events
        </Button>
        <Button onClick={handleDone} className="gap-1.5">
          View My Bookings
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}
