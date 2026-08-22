import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data as T
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: Record<string, unknown>; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, name: string, password: string) =>
    apiFetch<{ user: Record<string, unknown>; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    }),
  me: () =>
    apiFetch<{ user: Record<string, unknown> }>('/api/auth/me'),
  logout: () =>
    apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
}

// Events
export const eventsApi = {
  list: (params?: { type?: string; search?: string; date?: string }) => {
    const sp = new URLSearchParams()
    if (params?.type) sp.set('type', params.type)
    if (params?.search) sp.set('search', params.search)
    if (params?.date) sp.set('date', params.date)
    const qs = sp.toString()
    return apiFetch<{ events: Record<string, unknown>[] }>(
      `/api/events${qs ? `?${qs}` : ''}`
    )
  },
  get: (id: string) =>
    apiFetch<{ event: Record<string, unknown> }>(`/api/events/${id}`),
}

// Seats
export const seatsApi = {
  getForShow: (showId: string) =>
    apiFetch<{ show: Record<string, unknown>; seats: Record<string, unknown>[] }>(
      `/api/shows/${showId}/seats`
    ),
  hold: (seatIds: string[], showId: string) =>
    apiFetch<{ success: boolean; seats: Record<string, unknown>[] }>('/api/seats/hold', {
      method: 'POST',
      body: JSON.stringify({ seatIds, showId }),
    }),
  release: (seatIds: string[]) =>
    apiFetch<{ success: boolean }>('/api/seats/release', {
      method: 'POST',
      body: JSON.stringify({ seatIds }),
    }),
}

// Bookings
export const bookingsApi = {
  list: () =>
    apiFetch<{ bookings: Record<string, unknown>[] }>('/api/bookings'),
  create: (seatIds: string[], showId: string) =>
    apiFetch<{ booking: Record<string, unknown> }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ seatIds, showId }),
    }),
  cancel: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    }),
}

// Waitlist
export const waitlistApi = {
  list: () =>
    apiFetch<{ waitlists: Record<string, unknown>[] }>('/api/waitlist'),
  join: (showId: string, seatCategoryId: string) =>
    apiFetch<{ waitlist: Record<string, unknown> }>('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ showId, seatCategoryId }),
    }),
}

// Organiser
export const organiserApi = {
  events: () =>
    apiFetch<{ events: Record<string, unknown>[] }>('/api/organiser/events'),
}

// Admin
export const adminApi = {
  summary: () =>
    apiFetch<{
      stats: { totalEvents: number; totalBookings: number; totalUsers: number; totalRevenue: number }
      recentBookings: Record<string, unknown>[]
    }>('/api/admin/summary'),
}
