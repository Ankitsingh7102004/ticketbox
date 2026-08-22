'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { adminApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'

export function AdminDashboardView() {
  const { user } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: adminApi.summary,
    enabled: user?.role === 'ADMIN',
  })

  const stats = data?.stats
  const recentBookings = data?.recentBookings ?? []

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Admin Access Required</h2>
        <p className="mt-1 text-sm text-muted-foreground">You need admin privileges to view this page.</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats?.totalEvents ?? 0,
      icon: Ticket,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the TicketBox platform</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
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
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">{booking.bookingRef}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{booking.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{booking.show?.event?.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(booking.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${booking.totalAmount?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
