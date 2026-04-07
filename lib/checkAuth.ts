import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function checkAuth(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7))
}
