import { NextResponse } from 'next/server'
import { createUser, createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json()
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await createUser(email, name, password)
    const token = await createToken({ id: user.id, email: user.email, name: user.name, role: user.role })

    const res = NextResponse.json({ user, token })
    res.cookies.set('auth-token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}