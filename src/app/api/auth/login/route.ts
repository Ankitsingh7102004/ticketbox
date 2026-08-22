import { NextResponse } from 'next/server'
import { authenticateUser, createToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await authenticateUser(email, password)
    const token = await createToken(user)

    const res = NextResponse.json({ user, token })
    res.cookies.set('auth-token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return res
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Login failed'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}