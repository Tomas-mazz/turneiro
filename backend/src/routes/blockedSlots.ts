import { Router } from 'express'
import {
  getBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
} from '../controllers/blockedSlots.controller'
import { requireBusinessOwner } from '../middleware/auth'
import { requireBusinessContext } from '../middleware/businessContext'

const router = Router()

router.get('/', requireBusinessOwner, requireBusinessContext, getBlockedSlots)
router.post('/', requireBusinessOwner, requireBusinessContext, createBlockedSlot)
router.delete('/:id', requireBusinessOwner, requireBusinessContext, deleteBlockedSlot)

export default router
