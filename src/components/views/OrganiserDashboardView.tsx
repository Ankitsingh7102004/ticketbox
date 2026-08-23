'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  DollarSign,
  Ticket,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { organiserApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export function OrganiserDashboardView() {
  const { user, navigate, setSelectedEventId } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['organiser-events'],
    queryFn: organiserApi.events,
    enabled: user?.role === 'ORGANISER' || user?.role === 'ADMIN',
  })

  const events = data?.events ?? []
  const totalRevenue = events.reduce((sum: number, e: any) => sum + (e.revenue ?? 0), 0)
  const totalBookings = events.reduce((sum: number, e: any) => sum + (e.totalBookings ?? 0), 0)

  if (!user || (user.role !== 'ORGANISER' && user.role !== 'ADMIN')) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Organiser Access Required</h2>
        <p className="mt-1 text-sm text-muted-foreground">You need organiser privileges to view this page.</p>
      </div>
    )
  }

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    navigate('event-detail')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Organiser Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your events and track performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
          : [
              { title: 'My Events', value: events.length, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
              { title: 'Total Bookings', value: totalBookings, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
              { title: 'Avg. per Event', value: `$${events.length ? (totalRevenue / events.length).toFixed(0) : 0}`, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
            ].map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            My Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event: any, index: number) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                    onClick={() => handleEventClick(event.id)}
                  >
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{event.title}</h3>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.venue?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {event._count?.shows} shows
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">${(event.revenue ?? 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.totalBookings} booking{event.totalBookings !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
