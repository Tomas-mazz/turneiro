import type { BusinessContext } from '../middleware/businessContext'

declare global {
  namespace Express {
    interface Request {
      businessContext?: BusinessContext
      businessId?: string
    }
  }
}

export {}
