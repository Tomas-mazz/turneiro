import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET is not set in environment')
}

export type JwtPayload = {
  userId: string
  email: string
  role: string
  businessId?: string
}

const DEFAULT_EXPIRES_IN = '7d'

export function signToken(payload: JwtPayload, expiresIn: string = DEFAULT_EXPIRES_IN): string {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret) as JwtPayload
  return decoded
}
