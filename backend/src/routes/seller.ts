import { Router } from 'express'
import { requireSeller } from '../middleware/auth'
import {
  createSellerBusiness,
  getSellerBusiness,
  listSellerBusinesses,
  updateSellerBusiness,
} from '../controllers/seller.controller'

const router = Router()

router.get('/businesses', requireSeller, listSellerBusinesses)
router.get('/businesses/:id', requireSeller, getSellerBusiness)
router.post('/businesses', requireSeller, createSellerBusiness)
router.patch('/businesses/:id', requireSeller, updateSellerBusiness)

export default router

