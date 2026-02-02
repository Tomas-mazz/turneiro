import { z } from 'zod'

const phoneRegex = /^(\+?[1-9]\d{1,14}|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

export const createAppointmentSchema = z.object({
  businessSlug: z.string().min(1, 'El slug del negocio es obligatorio'),
  serviceId: z.string().min(1, 'El servicio es obligatorio'),
  date: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD'),
  slotTime: z.string().regex(timeRegex, 'El horario debe ser HH:MM'),
  clientName: z.string().min(1, 'El nombre es obligatorio').max(100),
  clientPhone: z.string().regex(phoneRegex, {
    message: 'El teléfono debe ser internacional (+1234567890) o formato local',
  }),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  token: z.string().min(1, 'El token de cancelación es obligatorio'),
})

export const updateServiceSchema = z.object({
  price: z.number().positive('El precio debe ser positivo').optional(),
  duration: z.number().int().min(15, 'Duración mínima 15 min').max(120, 'Duración máxima 120 min').optional(),
}).refine((data) => data.price !== undefined || data.duration !== undefined, {
  message: 'Debe enviar al menos precio o duración',
})

export const ownerCancelAppointmentSchema = z.object({
  reason: z.string().min(1, 'El motivo de cancelación es obligatorio').max(500),
})

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type OwnerCancelAppointmentInput = z.infer<typeof ownerCancelAppointmentSchema>

const emailSchema = z.string().email('Email inválido').min(1, 'El email es obligatorio')
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['OWNER', 'ADMIN', 'STAFF']).optional().default('OWNER'),
  businessId: z.string().cuid().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// Blocked slots (owner dashboard)
const blockedSlotTypeEnum = z.enum(['FULL_DAY', 'TIME_SLOT'])

export const createBlockedSlotSchema = z
  .object({
    date: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD'),
    type: blockedSlotTypeEnum,
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'FULL_DAY') return true
      return data.startTime != null && data.endTime != null
    },
    { message: 'Para bloqueo por horario se requieren startTime y endTime', path: ['startTime'] }
  )
  .refine(
    (data) => {
      if (data.type !== 'TIME_SLOT' || !data.startTime || !data.endTime) return true
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      return sh * 60 + sm < eh * 60 + em
    },
    { message: 'La hora de inicio debe ser anterior a la hora de fin', path: ['endTime'] }
  )

export type CreateBlockedSlotInput = z.infer<typeof createBlockedSlotSchema>

export const listBlockedSlotsQuerySchema = z.object({
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
})

export type ListBlockedSlotsQuery = z.infer<typeof listBlockedSlotsQuerySchema>
