import jwt from 'jsonwebtoken'

const secret: string = process.env.JWT_SECRET || ''
if (!secret) {
  throw new Error('JWT_SECRET is not set in environment')
}

export type JwtPayload = {
  userId: string
  email: string
  role: string
  businessId?: string
}

const DEFAULT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '7d'

export function signToken(
  payload: JwtPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = DEFAULT_EXPIRES_IN
): string {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret)
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid token payload')
  }
  return decoded as JwtPayload
}
