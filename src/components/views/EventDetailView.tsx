'use client'

import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Film,
  Music,
  Users,
  CheckCircle2,
  XCircle,
  DollarSign,
  Armchair,
  Hourglass,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { eventsApi, waitlistApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { useState } from 'react'

export function EventDetailView() {
  const { selectedEventId, setSelectedShowId, navigate, user, openAuthDialog } = useAppStore()
  const queryClient = useQueryClient()
  const [waitlistShowId, setWaitlistShowId] = useState<string | null>(null)
  const [waitlistCategory, setWaitlistCategory] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['event', selectedEventId],
    queryFn: () => eventsApi.get(selectedEventId!),
    enabled: !!selectedEventId,
  })

  const waitlistMutation = useMutation({
    mutationFn: ({ showId, seatCategoryId }: { showId: string; seatCategoryId: string }) =>
      waitlistApi.join(showId, seatCategoryId),
    onSuccess: () => {
      toast.success('You have been added to the waitlist! You will be notified when a seat becomes available.')
      setWaitlistShowId(null)
      setWaitlistCategory('')
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to join waitlist')
    },
  })

  const event = data?.event as any

  if (isLoading || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <Skeleton className="aspect-[2/3] w-full max-w-sm rounded-xl" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const handleSelectShow = (showId: string) => {
    if (!user) {
      openAuthDialog('login')
      return
    }
    setSelectedShowId(showId)
    navigate('seat-selection')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('home')}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Poster */}
        <motion.div
          className="relative aspect-[2/3] w-full max-w-sm mx-auto lg:mx-0 rounded-xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
            priority
          />
          <Badge
            className={`absolute top-4 left-4 ${event.type === 'MOVIE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {event.type === 'MOVIE' ? (
              <><Film className="mr-1 h-3 w-3" /> Movie</>
            ) : (
              <><Music className="mr-1 h-3 w-3" /> Concert</>
            )}
          </Badge>
        </motion.div>

        {/* Details */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.venue?.name} — {event.venue?.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {event.shows?.length} show{event.shows?.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-primary" />
                Ticket Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {event.eventPricings?.map((pricing: any) => (
                <div
                  key={pricing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: pricing.seatCategory?.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{pricing.seatCategory?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rows {pricing.seatCategory?.startRow}–{pricing.seatCategory?.endRow}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">${pricing.price.toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Show Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Show Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {event.shows?.map((show: any) => {
                  const available = show._count?.seats ?? 0
                  const totalBookings = show._count?.bookings ?? 0
                  const isActive = show.status === 'ACTIVE'
                  const isSoldOut = show.status === 'SOLD_OUT'

                  return (
                    <div
                      key={show.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${isActive ? 'hover:border-primary/50' : 'opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center rounded-lg bg-muted px-3 py-2 min-w-[60px]">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {format(parseISO(show.date), 'MMM')}
                          </span>
                          <span className="text-xl font-bold leading-none">
                            {format(parseISO(show.date), 'd')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{format(parseISO(show.date), 'EEEE, MMM d, yyyy')}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {show.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {available} seats left
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSoldOut ? (
                          waitlistShowId === show.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={waitlistCategory} onValueChange={setWaitlistCategory}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {event.eventPricings?.map((p: any) => (
                                    <SelectItem key={p.seatCategory?.id} value={p.seatCategory?.id}>
                                      {p.seatCategory?.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                                disabled={!waitlistCategory || waitlistMutation.isPending}
                                onClick={() =>
                                  waitlistCategory && waitlistMutation.mutate({ showId: show.id, seatCategoryId: waitlistCategory })
                                }
                              >
                                {waitlistMutation.isPending ? (
                                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Joining...</>
                                ) : (
                                  <><Hourglass className="h-3.5 w-3.5" /> Join Waitlist</>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setWaitlistShowId(null); setWaitlistCategory('') }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                              onClick={() => {
                                if (!user) { openAuthDialog('login'); return }
                                setWaitlistShowId(show.id)
                              }}
                            >
                              <Hourglass className="h-3.5 w-3.5" />
                              Join Waitlist
                            </Button>
                          )
                        ) : show.status === 'CANCELLED' ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" /> Cancelled
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSelectShow(show.id)}
                            className="gap-1.5"
                          >
                            <Armchair className="h-3.5 w-3.5" />
                            Select Seats
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
