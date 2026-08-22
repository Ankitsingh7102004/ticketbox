'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ListPlus,
  Clock,
  Calendar,
  Hourglass,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { waitlistApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'

const statusConfig: Record<string, { label: string; color: string }> = {
  WAITING: { label: 'Waiting', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  OFFERED: { label: 'Seat Available!', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  FULFILLED: { label: 'Fulfilled', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export function WaitlistView() {
  const { user, openAuthDialog, navigate } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: waitlistApi.list,
    enabled: !!user,
  })

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ListPlus className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Sign in to view waitlist</h2>
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
          Track your waitlisted entries for sold-out shows
        </p>
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
            return (
              <motion.div
                key={wl.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{wl.show?.event?.title}</h3>
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
                      </div>
                    </div>
                    <Badge variant="secondary" className={cfg.color}>
                      {cfg.label}
                    </Badge>
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
