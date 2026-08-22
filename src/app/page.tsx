'use client'

import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { queryClient } from '@/lib/api'
import { authApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthDialogs } from '@/components/layout/AuthDialogs'
import { HomeView } from '@/components/views/HomeView'
import { EventDetailView } from '@/components/views/EventDetailView'
import { SeatSelectionView } from '@/components/views/SeatSelectionView'
import { BookingConfirmationView } from '@/components/views/BookingConfirmationView'
import { MyBookingsView } from '@/components/views/MyBookingsView'
import { WaitlistView } from '@/components/views/WaitlistView'
import { AdminDashboardView } from '@/components/views/AdminDashboardView'
import { OrganiserDashboardView } from '@/components/views/OrganiserDashboardView'

function AppContent() {
  const { currentView, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)

  // Check auth on mount
  useEffect(() => {
    authApi
      .me()
      .then((data) => {
        if (data.user) {
          setUser(data.user as any)
        }
      })
      .catch(() => {
        // Not authenticated
      })
      .finally(() => setMounted(true))
  }, [])

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentView])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'event-detail':
        return <EventDetailView />
      case 'seat-selection':
        return <SeatSelectionView />
      case 'booking-confirmation':
        return <BookingConfirmationView />
      case 'my-bookings':
        return <MyBookingsView />
      case 'waitlist':
        return <WaitlistView />
      case 'admin-dashboard':
        return <AdminDashboardView />
      case 'organiser-dashboard':
        return <OrganiserDashboardView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <AuthDialogs />
    </div>
  )
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
