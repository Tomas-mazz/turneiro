import { describe, expect, it } from 'vitest'
import { createBusinessSchema, updateBusinessSchema, updateOwnerEmployeeSchema } from '../src/lib/schemas'

const business = {
  name: 'Barbería Demo',
  slug: 'barberia-demo',
  category: 'Barbería',
  paymentRequired: false,
}

describe('owner and staff names', () => {
  it('requires the owner name when creating a business', () => {
    expect(createBusinessSchema.safeParse(business).success).toBe(false)
    const r = createBusinessSchema.safeParse({ ...business, ownerName: '  Juan Pérez ' })
    expect(r.success && r.data.ownerName).toBe('Juan Pérez')
  })

  it('rejects an email as the owner name', () => {
    expect(createBusinessSchema.safeParse({ ...business, ownerName: 'juan@gmail.com' }).success).toBe(false)
    expect(updateBusinessSchema.safeParse({ ownerName: 'juan@gmail.com' }).success).toBe(false)
  })

  it('rejects an email as an employee name', () => {
    expect(updateOwnerEmployeeSchema.safeParse({ name: 'juan@gmail.com' }).success).toBe(false)
    expect(updateOwnerEmployeeSchema.safeParse({ name: 'Juan' }).success).toBe(true)
  })
})
