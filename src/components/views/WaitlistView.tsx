'use client'

import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ListPlus,
  Clock,
  Calendar,
  Hourglass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { waitlistApi, seatsApi, bookingsApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  WAITING: { label: 'Waiting', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Hourglass },
  OFFERED: { label: 'Seat Available!', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  EXPIRED: { label: 'Offer Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  FULFILLED: { label: 'Fulfilled', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
}

export function WaitlistView() {
  const { user, openAuthDialog, navigate, setSelectedEventId, setSelectedShowId } = useAppStore()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: waitlistApi.list,
    enabled: !!user,
  })

  const claimMutation = useMutation({
    mutationFn: async (wl: any) => {
      // Fetch available seats for this show
      const seatData = await seatsApi.getForShow(wl.showId)
      const availableSeat = seatData.seats?.find(
        (s: any) => s.status === 'AVAILABLE' && s.seatCategoryId === wl.seatCategoryId && s.heldBy === user?.id
      ) ?? seatData.seats?.find(
        (s: any) => s.status === 'HELD' && s.heldBy === user?.id
      )
      if (!availableSeat) {
        // Try to hold any available seat in this category
        const anyAvailable = seatData.seats?.find(
          (s: any) => s.status === 'AVAILABLE' && s.seatCategoryId === wl.seatCategoryId
        )
        if (!anyAvailable) throw new Error('Seat is no longer available')
        await seatsApi.hold([anyAvailable.id], wl.showId)
        return bookingsApi.create([anyAvailable.id], wl.showId)
      }
      return bookingsApi.create([availableSeat.id], wl.showId)
    },
    onSuccess: (data, variables) => {
      toast.success('Waitlist seat claimed! Your booking is confirmed.')
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      navigate('booking-confirmation')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to claim seat')
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
  })

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ListPlus className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Sign in to view waitlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your waitlist entries will appear here</p>
        <Button className="mt-4" onClick={() => openAuthDialog('login')}>
          Sign In
        </Button>
      </div>
    )
  }

  const waitlists = data?.waitlists ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Waitlist</h1>
        <p className="text-muted-foreground mt-1">
          Track your waitlisted entries for sold-out shows. When a seat becomes available, you will be notified and can claim it.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">How the waitlist works</p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              When someone cancels their booking, seats are automatically offered to the next person on the waitlist for that seat category.
              You will see a &quot;Seat Available!&quot; status and can claim the seat immediately.
              If you do not claim within the time limit, the seat moves to the next person in line.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : waitlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Hourglass className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No waitlist entries</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You will be added here when you join a waitlist for a sold-out show.
          </p>
          <Button className="mt-4" onClick={() => navigate('home')}>
            Browse Events
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlists.map((wl: any, index: number) => {
            const cfg = statusConfig[wl.status] ?? statusConfig.WAITING
            const StatusIcon = cfg.icon
            const canClaim = wl.status === 'OFFERED'

            return (
              <motion.div
                key={wl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={canClaim ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{wl.show?.event?.title}</h3>
                          <Badge variant="secondary" className={cfg.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseISO(wl.show?.date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {wl.show?.time}
                          </span>
                          <span className="flex items-center gap-1">
                            {wl.seatCategory?.name} section
                          </span>
                          <span className="text-xs">
                            Joined {format(parseISO(wl.createdAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        {canClaim && wl.offeredAt && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Seat offered on {format(parseISO(wl.offeredAt), 'MMM d, yyyy HH:mm')} — claim it before the offer expires!
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canClaim && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => claimMutation.mutate(wl)}
                            disabled={claimMutation.isPending}
                          >
                            {claimMutation.isPending ? (
                              <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Claiming...</>
                            ) : (
                              <><ArrowRight className="h-3.5 w-3.5" /> Claim Seat</>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEventId(wl.show?.event?.id)
                            setSelectedShowId(wl.showId)
                            navigate('seat-selection')
                          }}
                        >
                          View Show
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
