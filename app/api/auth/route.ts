import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const db = getDb()
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, username: user.username })
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    try {
      const { logActivity } = await import('@/lib/logger')
      await logActivity({ userId: user.id, modul: 'auth', action: 'login', description: `User ${username} login`, ipAddress: ip })
    } catch {}

    return NextResponse.json({ token, user: { id: user.id, username: user.username } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
