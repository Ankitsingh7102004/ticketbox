'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardList,
  MapPin,
  Calendar,
  Clock,
  X,
  Ticket,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  QrCode,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { bookingsApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { QRTicket } from '@/components/QRTicket'

export function MyBookingsView() {
  const { navigate, openAuthDialog, user } = useAppStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.list,
    enabled: !!user,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setCancelId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleDownloadTicket = (booking: any) => {
    const show = booking.show
    const event = show?.event
    const venue = event?.venue
    const seats = booking.bookingSeats ?? []
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
      `Seats: ${seats.map((bs: any) => `Row ${bs.seat?.row}, Seat ${bs.seat?.number} (${bs.seat?.seatCategory?.name})`).join(' | ')}`,
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Sign in to view bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your booking history will appear here</p>
        <Button className="mt-4" onClick={() => openAuthDialog('login')}>
          Sign In
        </Button>
      </div>
    )
  }

  const bookings = data?.bookings ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Bookings</h1>
        <p className="text-muted-foreground mt-1">View and manage your ticket bookings</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Ticket className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No bookings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Start by browsing events and booking your first tickets!</p>
          <Button className="mt-4" onClick={() => navigate('home')}>
            Browse Events
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {bookings.map((booking: any, index: number) => {
              const show = booking.show
              const event = show?.event
              const venue = event?.venue
              const bookingSeats = booking.bookingSeats ?? []
              const isExpanded = expandedId === booking.id
              const isCancelled = booking.status === 'CANCELLED'
              const qrData = JSON.stringify({
                ref: booking.bookingRef,
                event: event?.title,
                date: show?.date,
                time: show?.time,
                venue: venue?.name,
                seats: bookingSeats.map((bs: any) => `R${bs.seat?.row}S${bs.seat?.number}`),
                amount: booking.totalAmount,
              })

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`transition-all ${isCancelled ? 'opacity-60' : ''}`}>
                    <CardContent className="p-0">
                      <button
                        className="w-full text-left p-4 md:p-5"
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{event?.title}</h3>
                              <Badge
                                variant={isCancelled ? 'secondary' : 'default'}
                                className={`shrink-0 ${isCancelled ? 'text-destructive' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                              >
                                {isCancelled ? (
                                  <><XCircle className="mr-1 h-3 w-3" /> Cancelled</>
                                ) : (
                                  <><CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed</>
                                )}
                              </Badge>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="font-mono text-xs font-medium">{booking.bookingRef}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(parseISO(show?.date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {show?.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {venue?.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-lg font-bold">${booking.totalAmount?.toFixed(2)}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator />
                            <div className="p-4 md:p-5">
                              <div className="grid sm:grid-cols-[1fr,auto] gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium mb-2">Seats ({bookingSeats.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                      {bookingSeats.map((bs: any) => (
                                        <Badge key={bs.id} variant="outline" className="text-sm">
                                          R{bs.seat?.row} · S{bs.seat?.number}
                                          <span className="ml-1 text-muted-foreground">
                                            ({bs.seat?.seatCategory?.name})
                                          </span>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Booked on {format(parseISO(booking.createdAt), 'MMM d, yyyy')}</span>
                                    {!isCancelled && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCancelId(booking.id)
                                        }}
                                      >
                                        <X className="mr-1.5 h-3.5 w-3.5" />
                                        Cancel Booking
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* QR Code for each booking */}
                                {!isCancelled && (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-2.5 bg-white">
                                      <QRTicket value={qrData} size={110} />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <QrCode className="h-3 w-3" />
                                      E-Ticket QR
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => handleDownloadTicket(booking)}
                                    >
                                      <Download className="h-3 w-3" />
                                      Download
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? Your seats will be released and offered to the next person on the waitlist. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}