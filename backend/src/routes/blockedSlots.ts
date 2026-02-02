import { Router } from 'express'
import {
  getBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
} from '../controllers/blockedSlots.controller'
import { requireBusinessOwner } from '../middleware/auth'

const router = Router()

router.get('/', requireBusinessOwner, getBlockedSlots)
router.post('/', requireBusinessOwner, createBlockedSlot)
router.delete('/:id', requireBusinessOwner, deleteBlockedSlot)

export default router
