'use client'

import { motion } from 'framer-motion'
import { Ticket, Menu, ClipboardList, LayoutDashboard, CalendarDays, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useAppStore } from '@/lib/store'
import { authApi, queryClient } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import type { ViewType } from '@/lib/store'

export function Header() {
  const { user, setUser, navigate, currentView, openAuthDialog } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setUser(null)
      navigate('home')
      toast.success('Logged out successfully')
      queryClient.clear()
    },
  })

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleNav = (view: ViewType) => {
    navigate(view)
    setMobileOpen(false)
  }

  const navItems: { label: string; view: ViewType; icon: typeof CalendarDays; show: boolean }[] = [
    { label: 'Browse Events', view: 'home', icon: CalendarDays, show: true },
    { label: 'My Bookings', view: 'my-bookings', icon: ClipboardList, show: !!user },
    { label: 'Admin', view: 'admin-dashboard', icon: LayoutDashboard, show: user?.role === 'ADMIN' },
    { label: 'Dashboard', view: 'organiser-dashboard', icon: LayoutDashboard, show: user?.role === 'ORGANISER' },
  ]

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full border-b transition-colors ${scrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-background'}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            TicketBox
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.filter(n => n.show).map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.view ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {user.role.toLowerCase()}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNav('my-bookings')}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                {(user.role === 'ADMIN' || user.role === 'ORGANISER') && (
                  <DropdownMenuItem
                    onClick={() =>
                      handleNav(
                        user.role === 'ADMIN' ? 'admin-dashboard' : 'organiser-dashboard'
                      )
                    }
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuthDialog('login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => openAuthDialog('register')}>
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                TicketBox
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.filter(n => n.show).map((item) => (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${currentView === item.view ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
                {user && (
                  <>
                    <div className="my-2 border-t" />
                    <button
                      onClick={() => logoutMutation.mutate()}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </>
                )}
                {!user && (
                  <>
                    <div className="my-2 border-t" />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        openAuthDialog('login')
                        setMobileOpen(false)
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        openAuthDialog('register')
                        setMobileOpen(false)
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
