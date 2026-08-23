'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  Loader2,
  ShoppingCart,
  X,
  AlertCircle,
  ListPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { seatsApi, bookingsApi, waitlistApi } from '@/lib/api'
import { useAppStore, type SeatInfo } from '@/lib/store'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED'

export function SeatSelectionView() {
  const { selectedShowId, navigate, setSelectedSeats, setLastBooking, user, openAuthDialog } = useAppStore()
  const [localSelected, setLocalSelected] = useState<SeatInfo[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['show-seats', selectedShowId],
    queryFn: () => seatsApi.getForShow(selectedShowId!),
    enabled: !!selectedShowId,
    refetchInterval: 15000,
  })

  const show = data?.show as any
  const seats = (data?.seats ?? []) as SeatInfo[]

  const event = show?.event
  const venue = event?.venue
  const seatCategories = venue?.seatCategories ?? []
  const eventPricings = event?.eventPricings ?? []

  const totalRows = venue?.totalRows ?? 0
  const seatsPerRow = venue?.seatsPerRow ?? 0

  // Group seats by row for the map
  const seatMap = useMemo(() => {
    const map: Record<number, SeatInfo[]> = {}
    for (const seat of seats) {
      if (!map[seat.row]) map[seat.row] = []
      map[seat.row].push(seat)
    }
    return map
  }, [seats])

  const getCategoryForSeat = useCallback(
    (seat: SeatInfo) => seatCategories.find((c: any) => seat.row >= c.startRow && seat.row <= c.endRow),
    [seatCategories]
  )

  const getPriceForSeat = useCallback(
    (seat: SeatInfo) => {
      const pricing = eventPricings.find((p: any) => p.seatCategoryId === seat.seatCategoryId)
      return pricing?.price ?? 0
    },
    [eventPricings]
  )

  const toggleSeat = (seat: SeatInfo) => {
    if (seat.status !== 'AVAILABLE') return
    setLocalSelected((prev) => {
      const exists = prev.find((s) => s.id === seat.id)
      if (exists) return prev.filter((s) => s.id !== seat.id)
      if (prev.length >= 8) {
        toast.warning('Maximum 8 seats per booking')
        return prev
      }
      return [...prev, seat]
    })
  }

  const totalPrice = localSelected.reduce((sum, seat) => sum + getPriceForSeat(seat), 0)

  const holdMutation = useMutation({
    mutationFn: () => seatsApi.hold(localSelected.map((s) => s.id), selectedShowId!),
    onSuccess: () => {
      // Now create the booking
      bookMutation.mutate(localSelected.map((s) => s.id))
    },
    onError: (err: Error) => {
      toast.error(err.message)
      queryClient.invalidateQueries({ queryKey: ['show-seats'] })
    },
  })

  const bookMutation = useMutation({
    mutationFn: (seatIds: string[]) => bookingsApi.create(seatIds, selectedShowId!),
    onSuccess: (data) => {
      setLastBooking(data.booking as Record<string, unknown>)
      setSelectedSeats(localSelected)
      queryClient.invalidateQueries({ queryKey: ['show-seats'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      navigate('booking-confirmation')
      toast.success('Booking confirmed!')
    },
    onError: (err: Error) => {
      toast.error(err.message)
      queryClient.invalidateQueries({ queryKey: ['show-seats'] })
    },
  })

  const handleConfirmBooking = () => {
    if (!user) {
      openAuthDialog('login')
      return
    }
    setConfirmOpen(true)
  }

  const handleBook = () => {
    setConfirmOpen(false)
    holdMutation.mutate()
  }

  // Waitlist mutations
  const waitlistMutation = useMutation({
    mutationFn: (categoryId: string) => waitlistApi.join(selectedShowId!, categoryId),
    onSuccess: () => {
      toast.success('Added to waitlist! We will notify you when seats become available.')
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isProcessing = holdMutation.isPending || bookMutation.isPending

  if (isLoading || !show) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-40 mb-8" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const isSoldOut = show.status === 'SOLD_OUT'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and event info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('event-detail')} className="mb-2 gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Button>
          <h1 className="text-2xl font-bold">Select Your Seats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {event?.title} · {venue?.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(show.date), 'EEEE, MMM d, yyyy')} at {show.time}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSoldOut && (
            <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive">
              <AlertCircle className="h-3 w-3" /> Sold Out
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Seat Map */}
        <Card>
          <CardContent className="p-4 md:p-6">
            {/* Stage / Screen */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-2 rounded-b-3xl bg-gradient-to-b from-primary/20 to-primary/5 px-12 py-2">
                <Monitor className="h-4 w-4 text-primary/60" />
                <span className="text-xs font-medium uppercase tracking-widest text-primary/60">Screen / Stage</span>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[400px] mx-auto max-w-fit">
                {Array.from({ length: totalRows }, (_, rowIdx) => {
                  const rowNum = rowIdx + 1
                  const rowSeats = seatMap[rowNum] ?? []
                  const category = seatCategories.find(
                    (c: any) => rowNum >= c.startRow && rowNum <= c.endRow
                  )

                  // Show category label at the start of each new category
                  const isNewCategory =
                    rowIdx === 0 ||
                    (seatCategories.find(
                      (c: any) => rowNum - 1 >= c.startRow && rowNum - 1 <= c.endRow
                    )?.id !== category?.id)

                  return (
                    <div key={rowNum}>
                      {isNewCategory && category && (
                        <div className="my-2 flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            {category.name} · Rows {category.startRow}–{category.endRow}
                          </span>
                          <Separator className="flex-1" />
                        </div>
                      )}
                      <div className="flex items-center gap-1 py-0.5">
                        <span className="w-6 text-right text-xs text-muted-foreground font-mono">
                          {rowNum}
                        </span>
                        <div className="flex flex-1 items-center justify-center gap-1">
                          {Array.from({ length: seatsPerRow }, (_, seatIdx) => {
                            const seat = rowSeats.find((s) => s.number === seatIdx + 1)
                            if (!seat) {
                              // Empty placeholder (seat may not exist)
                              return <div key={seatIdx} className="h-7 w-7" />
                            }

                            const isSelected = localSelected.some((s) => s.id === seat.id)
                            const isBooked = seat.status === 'BOOKED' || seat.status === 'HELD'
                            const cat = getCategoryForSeat(seat)
                            const color = cat?.color ?? '#6B7280'

                            let bgClass = ''
                            let cursorClass = 'cursor-default'
                            if (isBooked) {
                              bgClass = 'bg-muted-foreground/30 cursor-not-allowed'
                            } else if (isSelected) {
                              bgClass = 'bg-primary hover:bg-primary/90 ring-2 ring-primary/50'
                              cursorClass = 'cursor-pointer'
                            } else {
                              bgClass = `hover:opacity-80 transition-all hover:scale-110`
                              cursorClass = 'cursor-pointer'
                            }

                            return (
                              <Tooltip key={seat.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    className={`h-7 w-7 rounded text-[10px] font-medium flex items-center justify-center transition-all ${cursorClass} ${bgClass}`}
                                    style={
                                      !isBooked && !isSelected
                                        ? { backgroundColor: color, color: '#fff' }
                                        : undefined
                                    }
                                    onClick={() => toggleSeat(seat)}
                                    disabled={isBooked || isSoldOut}
                                    aria-label={`Row ${seat.row} Seat ${seat.number} - ${seat.status}`}
                                  >
                                    {seat.number}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p>Row {seat.row}, Seat {seat.number}</p>
                                  <p>{cat?.name ?? 'Unknown'}</p>
                                  <p>${getPriceForSeat(seat).toFixed(2)}</p>
                                  {seat.status !== 'AVAILABLE' && (
                                    <p className="text-destructive capitalize">{seat.status.toLowerCase()}</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                        <span className="w-6 text-xs text-muted-foreground font-mono">
                          {rowNum}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded bg-primary" />
                <span>Selected</span>
              </div>
              {seatCategories.map((cat: any) => (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded bg-muted-foreground/30" />
                <span>Taken</span>
              </div>
            </div>

            {isSoldOut && (
              <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-center">
                <p className="text-sm font-medium text-destructive">This show is sold out.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {seatCategories.map((cat: any) => (
                    <Button
                      key={cat.id}
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => waitlistMutation.mutate(cat.id)}
                      disabled={waitlistMutation.isPending}
                    >
                      <ListPlus className="h-3.5 w-3.5" />
                      Waitlist: {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {localSelected.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click on available seats to select them
                </p>
              ) : (
                <>
                  <ScrollArea className="max-h-48">
                    <AnimatePresence>
                      {localSelected.map((seat) => {
                        const cat = getCategoryForSeat(seat)
                        const price = getPriceForSeat(seat)
                        return (
                          <motion.div
                            key={seat.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: cat?.color }}
                              />
                              <span className="text-sm">
                                R{seat.row} · S{seat.number}
                              </span>
                              <span className="text-xs text-muted-foreground">{cat?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">${price.toFixed(2)}</span>
                              <button
                                onClick={() => toggleSeat(seat)}
                                className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                              >
                                <X className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </ScrollArea>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {localSelected.length} seat{localSelected.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-lg font-bold">${totalPrice.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmBooking}
                    disabled={localSelected.length === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><ShoppingCart className="mr-2 h-4 w-4" /> Confirm Booking</>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Booking</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to book {localSelected.length} seat{localSelected.length !== 1 ? 's' : ''} for a total of{' '}
              <span className="font-semibold text-foreground">${totalPrice.toFixed(2)}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBook}>Confirm & Pay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
