'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { 
  Search, 
  Film, 
  Music, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { eventsApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { format, parseISO } from 'date-fns'

type EventType = 'ALL' | 'MOVIE' | 'CONCERT'

export function HomeView() {
  const [typeFilter, setTypeFilter] = useState<EventType>('ALL')
  const [search, setSearch] = useState('')
  const { navigate, setSelectedEventId } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['events', typeFilter, search],
    queryFn: () => eventsApi.list({ type: typeFilter, search: search || undefined }),
  })

  const events = data?.events ?? []

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    navigate('event-detail')
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Book Your Experience
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Discover{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Amazing
              </span>{' '}
              Events
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              From blockbuster movies to electrifying concerts — find and book your perfect seat.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 rounded-lg"
                />
              </div>
              <Button size="lg" className="rounded-lg px-6" onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {[
              { icon: Film, label: 'Movies', count: events.filter(e => e.type === 'MOVIE').length },
              { icon: Music, label: 'Concerts', count: events.filter(e => e.type === 'CONCERT').length },
              { icon: Star, label: 'Shows', count: events.reduce((sum: number, e: any) => sum + (e._count?.shows ?? 0), 0) },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 rounded-xl bg-background/60 p-4 backdrop-blur">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stat.count}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events-section" className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
            <p className="text-muted-foreground mt-1">
              {isLoading ? 'Loading...' : `${events.length} event${events.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={typeFilter}
            onValueChange={(v) => v && setTypeFilter(v as EventType)}
            className="rounded-lg border bg-muted p-1"
          >
            <ToggleGroupItem value="ALL" className="rounded-md px-4 text-sm gap-1.5" aria-label="All events">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="MOVIE" className="rounded-md px-4 text-sm gap-1.5" aria-label="Movies">
              <Film className="h-3.5 w-3.5" />
              Movies
            </ToggleGroupItem>
            <ToggleGroupItem value="CONCERT" className="rounded-md px-4 text-sm gap-1.5" aria-label="Concerts">
              <Music className="h-3.5 w-3.5" />
              Concerts
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Event Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[2/3] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No events found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event: any, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-1"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge
                      className={`absolute top-3 left-3 ${event.type === 'MOVIE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                      {event.type === 'MOVIE' ? (
                        <><Film className="mr-1 h-3 w-3" /> Movie</>
                      ) : (
                        <><Music className="mr-1 h-3 w-3" /> Concert</>
                      )}
                    </Badge>
                    {event.shows?.[0] && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs text-white/80">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(parseISO(event.shows[0].date), 'MMM d, yyyy')}
                          {event.shows[0].time && ` · ${event.shows[0].time}`}
                        </p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{event.venue?.name}</span>
                    </div>
                    {event.shows?.[0]?._count && (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {event.shows[0]._count.seats} seats available
                        </div>
                        <span className="text-xs font-medium text-primary">
                          From ${(event.eventPricings?.[0]?.price ?? 0).toFixed(0)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
