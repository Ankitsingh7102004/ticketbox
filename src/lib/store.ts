import { create } from 'zustand'

export type ViewType =
  | 'home'
  | 'event-detail'
  | 'seat-selection'
  | 'booking-confirmation'
  | 'my-bookings'
  | 'waitlist'
  | 'admin-dashboard'
  | 'organiser-dashboard'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface SeatInfo {
  id: string
  row: number
  number: number
  seatCategoryId: string
  status: string
  seatCategory: {
    id: string
    name: string
    color: string
    startRow: number
    endRow: number
    priceMultiplier: number
  }
}

interface AppState {
  // View routing
  currentView: ViewType
  navigate: (view: ViewType) => void
  previousView: ViewType | null

  // Auth
  user: User | null
  setUser: (user: User | null) => void
  authDialogOpen: boolean
  authDialogMode: 'login' | 'register'
  openAuthDialog: (mode?: 'login' | 'register') => void
  closeAuthDialog: () => void

  // Selected event/show
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void
  selectedShowId: string | null
  setSelectedShowId: (id: string | null) => void

  // Seat selection
  selectedSeats: SeatInfo[]
  setSelectedSeats: (seats: SeatInfo[]) => void
  clearSelection: () => void

  // Last booking
  lastBooking: Record<string, unknown> | null
  setLastBooking: (booking: Record<string, unknown> | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  navigate: (view) =>
    set((state) => ({
      previousView: state.currentView,
      currentView: view,
    })),
  previousView: null,

  user: null,
  setUser: (user) => set({ user }),
  authDialogOpen: false,
  authDialogMode: 'login',
  openAuthDialog: (mode = 'login') =>
    set({ authDialogOpen: true, authDialogMode: mode }),
  closeAuthDialog: () => set({ authDialogOpen: false }),

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  selectedShowId: null,
  setSelectedShowId: (id) => set({ selectedShowId: id }),

  selectedSeats: [],
  setSelectedSeats: (seats) => set({ selectedSeats: seats }),
  clearSelection: () => set({ selectedSeats: [] }),

  lastBooking: null,
  setLastBooking: (booking) => set({ lastBooking: booking }),
}))
