import { cookies } from 'next/headers'
import { db } from './db'
import { compare, hash } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode('ticketbox-secret-key-2026')

export async function createUser(email: string, name: string, password: string, role: string = 'CUSTOMER') {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) throw new Error('Email already exists')

  const hashed = await hash(password, 10)
  return db.user.create({
    data: { email, name, password: hashed, role },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) throw new Error('Invalid credentials')

  const valid = await compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }
}

export async function createToken(payload: { id: string; email: string; name: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { id: string; email: string; name: string; role: string }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}
