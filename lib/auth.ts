import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.APP_SECRET || 'fallback-secret'
const EXPIRES = process.env.JWT_EXPIRES_IN || '24h'

export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12
  return bcrypt.hash(password, rounds)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { userId: number; username: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES } as any)
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, SECRET) as any
  } catch {
    return null
  }
}
