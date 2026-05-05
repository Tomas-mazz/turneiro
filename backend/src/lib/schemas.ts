import { z } from 'zod'

const phoneRegex = /^(\+?[1-9]\d{1,14}|\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

export const createAppointmentSchema = z.object({
  businessSlug: z.string().min(1, 'El slug del negocio es obligatorio'),
  // Backwards compatible: either a single serviceId OR an array of serviceIds (multi-select).
  serviceId: z.string().min(1, 'El servicio es obligatorio').optional(),
  serviceIds: z.array(z.string().min(1)).min(1).optional(),
  date: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD'),
  slotTime: z.string().regex(timeRegex, 'El horario debe ser HH:MM'),
  clientName: z.string().min(1, 'El nombre es obligatorio').max(100),
  clientEmail: z.string().email('Ingresá un email válido'),
  clientPhone: z.string().regex(phoneRegex, {
    message: 'El teléfono debe ser internacional (+1234567890) o formato local',
  }),
  // Optional for backwards compatibility; when multi-employee is enabled,
  // frontend must send the selected employee id.
  employeeId: z.string().cuid().optional().nullable(),
  // When true, appointment is created but confirmation side-effects (email/calendar)
  // are deferred until payment is confirmed.
  deferConfirmationUntilPayment: z.boolean().optional(),
  /** Optional extras; only allowed for single-service bookings and wellness/salón businesses. */
  addOnIds: z.array(z.string().min(1)).optional(),
}).refine((data) => {
  const hasSingle = typeof data.serviceId === 'string' && data.serviceId.trim().length > 0
  const hasMany = Array.isArray(data.serviceIds) && data.serviceIds.length > 0
  return hasSingle || hasMany
}, { message: 'Debe enviar serviceId o serviceIds', path: ['serviceId'] })

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  token: z.string().min(1, 'El token de cancelación es obligatorio'),
})

export const updateServiceSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    price: z.number().positive('El precio debe ser positivo').optional(),
    duration: z
      .number()
      .int()
      .min(15, 'Duración mínima 15 min')
      .max(120, 'Duración máxima 120 min')
      .optional(),
    isActive: z.boolean().optional(),
    shortDescription: z.string().max(300).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    images: z.array(z.string().url()).max(5, 'Máximo 5 imágenes').optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.price !== undefined ||
      data.duration !== undefined ||
      data.isActive !== undefined ||
      data.shortDescription !== undefined ||
      data.description !== undefined ||
      data.images !== undefined,
    {
      message: 'Debe enviar al menos un campo para actualizar',
    }
  )

export const ownerCancelAppointmentSchema = z.object({
  reason: z.string().min(1, 'El motivo de cancelación es obligatorio').max(500),
})

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>

// Admin: full service CRUD
export const createServiceAdminSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  price: z.number().positive('El precio debe ser positivo'),
  duration: z.number().int().min(15, 'Duración mínima 15 min').max(120, 'Duración máxima 120 min'),
  isActive: z.boolean().optional().default(true),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(5, 'Máximo 5 imágenes').optional(),
})

export const updateServiceAdminSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().min(15).max(120).optional(),
  isActive: z.boolean().optional(),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(5, 'Máximo 5 imágenes').optional(),
})

export type CreateServiceAdminInput = z.infer<typeof createServiceAdminSchema>
export type UpdateServiceAdminInput = z.infer<typeof updateServiceAdminSchema>

// Admin: subservices CRUD (attached to a parent service)
export const createSubServiceAdminSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  price: z.number().positive('El precio debe ser positivo'),
  duration: z.number().int().min(15, 'Duración mínima 15 min').max(120, 'Duración máxima 120 min'),
  isActive: z.boolean().optional().default(true),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(5, 'Máximo 5 imágenes').optional(),
})

export const updateSubServiceAdminSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().min(15).max(120).optional(),
  isActive: z.boolean().optional(),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(5, 'Máximo 5 imágenes').optional(),
})

export type CreateSubServiceAdminInput = z.infer<typeof createSubServiceAdminSchema>
export type UpdateSubServiceAdminInput = z.infer<typeof updateSubServiceAdminSchema>

export const createServiceAddOnSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  isActive: z.boolean().optional().default(true),
  serviceIds: z.array(z.string().min(1)).default([]),
  subServiceIds: z.array(z.string().min(1)).default([]),
})

export const updateServiceAddOnSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    price: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
    serviceIds: z.array(z.string().min(1)).optional(),
    subServiceIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.price !== undefined ||
      data.isActive !== undefined ||
      data.serviceIds !== undefined ||
      data.subServiceIds !== undefined,
    { message: 'Debe enviar al menos un campo para actualizar' }
  )

export type CreateServiceAddOnInput = z.infer<typeof createServiceAddOnSchema>
export type UpdateServiceAddOnInput = z.infer<typeof updateServiceAddOnSchema>

export type OwnerCancelAppointmentInput = z.infer<typeof ownerCancelAppointmentSchema>

const emailSchema = z.string().email('Email inválido').min(1, 'El email es obligatorio')
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  email: emailSchema,
  password: passwordSchema,
  businessSlug: z.string().min(1, 'El slug del negocio es obligatorio'),
})

export type RegisterInput = z.infer<typeof registerSchema>

// Blocked slots (owner dashboard)
const blockedSlotTypeEnum = z.enum(['FULL_DAY', 'TIME_SLOT'])
const blockedScopeEnum = z.enum(['BUSINESS', 'SELF'])

export const createBlockedSlotSchema = z
  .object({
    date: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD'),
    type: blockedSlotTypeEnum,
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    reason: z.string().max(500).optional(),
    // Optional scope for owner to choose between business-wide or personal calendar.
    // Staff and admin callers can omit this field.
    scope: blockedScopeEnum.optional(),
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

// Admin: create business (step 2)
const slugSchema = z
  .string()
  .min(1, 'El slug es obligatorio')
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug solo letras minúsculas, números y guiones')
  .transform((s) => s.toLowerCase())

const optionalEmail = z.union([z.string().email(), z.literal('')]).transform((s) => (s === '' ? undefined : s))
// Accept full URL (http/https) or relative path (/uploads/...) - upload may return either
const optionalUrl = z
  .union([z.string().url(), z.string().regex(/^\/[^\s]*$/, 'Debe ser URL o ruta'), z.literal('')])
  .transform((s) => (s === '' ? undefined : s))

const createBusinessObjectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  slug: slugSchema,
  category: z.string().min(1, 'La categoría es obligatoria').max(100),
  description: z.string().max(1000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: optionalEmail.optional(),
  address: z.string().max(300).optional().nullable(),
  logo: optionalUrl.optional(),
  coverPhoto: optionalUrl.optional(),
  coverVideo: optionalUrl.optional(),
  coverPhotoMobile: optionalUrl.optional(),
  coverVideoMobile: optionalUrl.optional(),
  theme: z.enum(['DARK', 'LIGHT']).optional().default('DARK'),
  paymentRequired: z.boolean(),
  ownerEmail: z.union([z.string().email(), z.literal('')]).optional(),
  ownerPassword: z.string().optional(),
})

function requireOwnerPasswordIfOwnerEmailPresent<T extends { ownerEmail?: string; ownerPassword?: string }>(
  data: T
): boolean {
  const email = typeof data.ownerEmail === 'string' ? data.ownerEmail.trim() : ''
  if (!email) return true
  return !!data.ownerPassword && data.ownerPassword.length >= 6
}

export const createBusinessSchema = createBusinessObjectSchema.refine(
  requireOwnerPasswordIfOwnerEmailPresent,
  {
    message:
      'Si indicás email del owner, la contraseña es obligatoria (mín. 6 caracteres)',
    path: ['ownerPassword'],
  }
)

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .transform((s) => s.toLowerCase())
    .optional(),
  category: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: optionalEmail.optional(),
  address: z.string().max(300).optional().nullable(),
  logo: optionalUrl.optional().nullable(),
  coverPhoto: optionalUrl.optional().nullable(),
  coverVideo: optionalUrl.optional().nullable(),
  coverPhotoMobile: optionalUrl.optional().nullable(),
  coverVideoMobile: optionalUrl.optional().nullable(),
  theme: z.enum(['DARK', 'LIGHT']).optional(),
  paymentRequired: z.boolean().optional(),
  paymentOptionalEnabled: z.boolean().optional(),
  paymentType: z.enum(['PERCENTAGE', 'FULL']).optional(),
  depositPercentage: z.number().min(1, 'Mínimo 1%').max(100, 'Máximo 100%').optional().nullable(),
  mercadoPagoPublicKey: z.string().max(255).optional().nullable(),
  mercadoPagoAccessToken: z.string().max(500).optional().nullable(),
  mercadoPagoWebhookSecret: z.string().max(500).optional().nullable(),
  freeCancellationWindow: z.number().int().min(0, 'Mínimo 0 horas').optional().nullable(),
  cancellationHasCost: z.boolean().optional(),
  lateCancellationFee: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional().nullable(),
  bufferTime: z.number().int().min(0, 'Mínimo 0 minutos').optional().nullable(),
  slotIntervalMinutes: z
    .number()
    .int()
    .min(5, 'Mínimo 5 minutos')
    .max(240, 'Máximo 240 minutos')
    .optional(),
  ownerEmail: z.union([z.string().email(), z.literal('')]).optional(),
  ownerPassword: z.string().optional(),
})

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>

// Seller: reduced business create/edit (base fields + owner credentials only)
export const createBusinessSellerSchema = createBusinessObjectSchema
  .omit({
    paymentRequired: true,
  })
  .extend({
    // Seller cannot configure paymentRequired; keep it off by default.
    paymentRequired: z.boolean().optional(),
  })
  .refine(requireOwnerPasswordIfOwnerEmailPresent, {
    message:
      'Si indicás email del owner, la contraseña es obligatoria (mín. 6 caracteres)',
    path: ['ownerPassword'],
  })

export const updateBusinessSellerSchema = updateBusinessSchema.omit({
  paymentRequired: true,
  paymentOptionalEnabled: true,
  paymentType: true,
  depositPercentage: true,
  mercadoPagoPublicKey: true,
  mercadoPagoAccessToken: true,
  mercadoPagoWebhookSecret: true,
  freeCancellationWindow: true,
  cancellationHasCost: true,
  lateCancellationFee: true,
  bufferTime: true,
  slotIntervalMinutes: true,
})

export type CreateBusinessSellerInput = z.infer<typeof createBusinessSellerSchema>
export type UpdateBusinessSellerInput = z.infer<typeof updateBusinessSellerSchema>

// Admin: working hours (one record per day, 0=Sunday .. 6=Saturday)
const workingHoursItemSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    endTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    isClosed: z.boolean(),
    lunchStart: z.string().regex(timeRegex).optional().nullable(),
    lunchEnd: z.string().regex(timeRegex).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isClosed) return true
      const [sh, sm] = data.startTime.split(':').map(Number)
      const [eh, em] = data.endTime.split(':').map(Number)
      return sh * 60 + sm < eh * 60 + em
    },
    { message: 'La hora de inicio debe ser anterior a la de cierre', path: ['endTime'] }
  )
  .refine(
    (data) => {
      if (!data.lunchStart || !data.lunchEnd) return true
      const [sh, sm] = data.lunchStart.split(':').map(Number)
      const [eh, em] = data.lunchEnd.split(':').map(Number)
      return sh * 60 + sm < eh * 60 + em
    },
    { message: 'La pausa de almuerzo debe tener inicio anterior al fin', path: ['lunchEnd'] }
  )

export const updateWorkingHoursSchema = z.object({
  hours: z
    .array(workingHoursItemSchema)
    .length(7, 'Deben enviarse exactamente 7 días (0=Domingo .. 6=Sábado)')
    .refine(
      (arr) => {
        const days = arr.map((h) => h.dayOfWeek).sort((a, b) => a - b)
        return days[0] === 0 && days[6] === 6 && new Set(days).size === 7
      },
      { message: 'Cada dayOfWeek del 0 al 6 debe aparecer una vez' }
    ),
})

export type WorkingHoursItemInput = z.infer<typeof workingHoursItemSchema>
export type UpdateWorkingHoursInput = z.infer<typeof updateWorkingHoursSchema>

// Admin: appointments list & actions

const appointmentStatusEnum = z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED'])

export const adminListAppointmentsQuerySchema = z.object({
  businessId: z.string().cuid().optional(),
  dateFrom: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD').optional(),
  dateTo: z.string().regex(dateRegex, 'La fecha debe ser AAAA-MM-DD').optional(),
  status: appointmentStatusEnum.optional(),
})

export type AdminListAppointmentsQuery = z.infer<typeof adminListAppointmentsQuerySchema>

export const adminCancelAppointmentSchema = z.object({
  reason: z.string().min(1, 'El motivo de cancelación es obligatorio').max(500),
})

export type AdminCancelAppointmentInput = z.infer<typeof adminCancelAppointmentSchema>

export const adminUpdateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum.exclude(['CANCELLED']),
})

export type AdminUpdateAppointmentStatusInput = z.infer<typeof adminUpdateAppointmentStatusSchema>

// Admin: sellers (platform users)
export const createSellerAdminSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(100).optional().nullable(),
})

export type CreateSellerAdminInput = z.infer<typeof createSellerAdminSchema>

// Admin: employees CRUD

export const createEmployeeAdminSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio').max(200),
    photoUrl: optionalUrl.optional(),
    // Optional credentials to create a STAFF user that can log into /dashboard
    staffEmail: z.union([z.string().email(), z.literal('')]).optional(),
    staffPassword: z.string().min(6).optional(),
    // Marca si este empleado representa al dueño (se usa para badge y para flujos especiales)
    isOwner: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const hasEmail = !!data.staffEmail && data.staffEmail !== ''
      const hasPassword = !!data.staffPassword && data.staffPassword.length >= 6
      // Both empty (no panel access) OR both valid (email+password)
      return (hasEmail && hasPassword) || (!hasEmail && !hasPassword)
    },
    {
      message:
        'Si configurás acceso al panel para el empleado, email y contraseña son obligatorios (mín. 6 caracteres).',
      path: ['staffEmail'],
    }
  )

export const updateEmployeeAdminSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  photoUrl: optionalUrl.optional(),
})

export type CreateEmployeeAdminInput = z.infer<typeof createEmployeeAdminSchema>
export type UpdateEmployeeAdminInput = z.infer<typeof updateEmployeeAdminSchema>

// Owner dashboard: employees CRUD (scoped to current business)
const optionalColorId = z
  .union([z.string().regex(/^(?:[1-9]|10|11)$/), z.literal('')])
  .optional()
  .transform((v) => (v === '' ? null : v))

export const createOwnerEmployeeSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  photoUrl: optionalUrl.optional(),
  staffEmail: z.string().email('Email inválido'),
  staffPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  ownerCalendarColorId: optionalColorId,
})

export const updateOwnerEmployeeSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    photoUrl: optionalUrl.optional(),
    staffEmail: z.union([z.string().email(), z.literal('')]).optional(),
    staffPassword: z.union([z.string().min(6), z.literal('')]).optional(),
    ownerCalendarColorId: optionalColorId,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.photoUrl !== undefined ||
      data.staffEmail !== undefined ||
      data.staffPassword !== undefined ||
      data.ownerCalendarColorId !== undefined,
    { message: 'Debe enviar al menos un campo para actualizar' }
  )

export type CreateOwnerEmployeeInput = z.infer<typeof createOwnerEmployeeSchema>
export type UpdateOwnerEmployeeInput = z.infer<typeof updateOwnerEmployeeSchema>

// Per-employee service durations (OWNER/ADMIN acting as shop)
const employeeServiceDurationItemSchema = z
  .object({
    serviceId: z.string().cuid().optional(),
    subServiceId: z.string().cuid().optional(),
    duration: z.number().int().min(5, 'Duración mínima 5 min').max(600, 'Duración máxima 600 min').nullable(),
  })
  .refine((x) => {
    const hasService = typeof x.serviceId === 'string' && x.serviceId.length > 0
    const hasSub = typeof x.subServiceId === 'string' && x.subServiceId.length > 0
    return hasService !== hasSub
  }, { message: 'Debe enviar serviceId o subServiceId (solo uno)' })

export const upsertEmployeeServiceDurationsSchema = z.object({
  items: z.array(employeeServiceDurationItemSchema).max(500),
})

export type UpsertEmployeeServiceDurationsInput = z.infer<typeof upsertEmployeeServiceDurationsSchema>

export const updateOwnerCalendarColorSchema = z.object({
  ownerCalendarColorId: optionalColorId,
})

export type UpdateOwnerCalendarColorInput = z.infer<typeof updateOwnerCalendarColorSchema>
