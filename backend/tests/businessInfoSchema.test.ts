import { describe, expect, it } from 'vitest'
import { updateBusinessInfoSchema } from '../src/lib/schemas'

const parse = (body: unknown) => updateBusinessInfoSchema.safeParse(body)

describe('updateBusinessInfoSchema', () => {
  it('normalizes WhatsApp numbers to digits only', () => {
    for (const input of ['+54 9 351 123-4567', '5493511234567', 'https://wa.me/5493511234567']) {
      const r = parse({ whatsapp: input })
      expect(r.success && r.data.whatsapp).toBe('5493511234567')
    }
  })

  it('rejects WhatsApp numbers that are too short', () => {
    expect(parse({ whatsapp: '12345' }).success).toBe(false)
  })

  it('normalizes Instagram handles and links', () => {
    for (const input of ['tubarberia', '@tubarberia', 'https://www.instagram.com/tubarberia/', 'https://instagram.com/tubarberia?igsh=abc']) {
      const r = parse({ instagram: input })
      expect(r.success && r.data.instagram).toBe('tubarberia')
    }
  })

  it('rejects Instagram values with spaces', () => {
    expect(parse({ instagram: 'tu barberia' }).success).toBe(false)
  })

  it('requires http(s) links', () => {
    expect(parse({ mapsUrl: 'https://maps.app.goo.gl/abc' }).success).toBe(true)
    expect(parse({ facebook: 'javascript:alert(1)' }).success).toBe(false)
    expect(parse({ googleReviewsUrl: 'not a url' }).success).toBe(false)
  })

  it('turns empty strings into null so owners can clear a field', () => {
    const r = parse({ whatsapp: '', instagram: '  ', description: '', mapsUrl: '' })
    expect(r.success && r.data).toEqual({ whatsapp: null, instagram: null, description: null, mapsUrl: null })
  })

  it('leaves omitted fields undefined', () => {
    const r = parse({ phone: ' 351 123 4567 ' })
    expect(r.success && r.data).toEqual({ phone: '351 123 4567' })
  })

  it('does not allow clearing the name', () => {
    expect(parse({ name: '' }).success).toBe(false)
  })

  it('rejects fields an owner cannot edit', () => {
    expect(parse({ slug: 'otro-negocio' }).success).toBe(false)
  })
})
