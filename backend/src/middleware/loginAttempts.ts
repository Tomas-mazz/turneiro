/**
 * Tracks failed login attempts per IP.
 * - First 5 failures: no lockout.
 * - 6th failure: lock 1 min → "Intentálo de nuevo en 1 min"
 * - After 1 min, 3 more failures (7th, 8th, 9th): lock 10 min → "Intentálo en 10 min"
 * - On successful login we clear the key so the user can try again after logging out.
 */

const ONE_MIN_MS = 60 * 1000
const TEN_MIN_MS = 10 * 60 * 1000

type Entry = { count: number; lockoutUntil: number }

const store = new Map<string, Entry>()

function getClientKey(ip: string): string {
  return ip || 'unknown'
}

export function getLoginLockMessage(ip: string): { message: string; retryAfterSeconds: number } | null {
  const key = getClientKey(ip)
  const entry = store.get(key)
  if (!entry) return null
  const now = Date.now()
  if (now < entry.lockoutUntil) {
    const retryAfterSeconds = Math.ceil((entry.lockoutUntil - now) / 1000)
    const minutes = Math.ceil(retryAfterSeconds / 60)
    const message =
      minutes <= 1
        ? 'Intentálo de nuevo en 1 min.'
        : `Intentálo de nuevo en ${minutes} min.`
    return { message, retryAfterSeconds }
  }
  return null
}

export function recordLoginFailure(ip: string): void {
  const key = getClientKey(ip)
  const now = Date.now()
  let entry = store.get(key)
  if (!entry) {
    entry = { count: 0, lockoutUntil: 0 }
    store.set(key, entry)
  }
  // If we were in a lockout that has expired, keep count so we can move to 10 min after 3 more
  if (now >= entry.lockoutUntil) {
    entry.count += 1
    if (entry.count === 6) {
      entry.lockoutUntil = now + ONE_MIN_MS
    } else if (entry.count >= 9) {
      entry.lockoutUntil = now + TEN_MIN_MS
    }
  }
}

export function clearLoginLock(ip: string): void {
  store.delete(getClientKey(ip))
}
