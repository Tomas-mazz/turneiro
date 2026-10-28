import { describe, expect, it } from 'vitest'
import { completeCheckoutSchema, holdAppointmentSchema } from '../src/lib/schemas'

const hold = { businessSlug: 'barberia-demo', serviceIds: ['svc_1'], date: '2026-11-02', slotTime: '10:00' }
const checkout = {
  cancellationToken: 'tok',
  clientName: 'Juan Pérez',
  clientEmail: 'juan@example.com',
  clientPhone: '+5493511234567',
  payAt: 'ONLINE',
}

describe('checkout schemas', () => {
  it('holds a slot without client details', () => {
    expect(holdAppointmentSchema.safeParse(hold).success).toBe(true)
  })

  it('needs a service to hold a slot', () => {
    expect(holdAppointmentSchema.safeParse({ ...hold, serviceIds: undefined }).success).toBe(false)
  })

  it('requires the client details and a payment choice to complete', () => {
    expect(completeCheckoutSchema.safeParse(checkout).success).toBe(true)
    expect(completeCheckoutSchema.safeParse({ ...checkout, payAt: 'SHOP' }).success).toBe(true)
    expect(completeCheckoutSchema.safeParse({ ...checkout, payAt: 'LATER' }).success).toBe(false)
    expect(completeCheckoutSchema.safeParse({ ...checkout, clientName: '  ' }).success).toBe(false)
    expect(completeCheckoutSchema.safeParse({ ...checkout, clientEmail: 'nope' }).success).toBe(false)
  })
})
