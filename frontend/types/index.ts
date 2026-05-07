// TypeScript type definitions

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface ServiceListItem {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
  shortDescription?: string | null
  description?: string | null
  images?: string[]
}

export interface SubServiceAdminItem {
  id: string
  name: string
  price: number
  duration: number
  isActive: boolean
  shortDescription: string | null
  description: string | null
  images?: string[]
}

export interface ServiceAddOnAdminItem {
  id: string
  name: string
  price: number
  isActive: boolean
  serviceIds: string[]
  subServiceIds: string[]
}

export interface AppointmentListItem {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  price: number
  clientName: string
  clientPhone: string
  status: string
  paymentStatus: string
}

export interface AdminAppointmentListItem extends AppointmentListItem {
  businessId: string
  businessName: string
  cancellationReason: string | null
  refundAmount: number | null
  createdAt: string
}

export interface BlockedSlotListItem {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  type: string
  reason: string | null
  createdAt: string
}

export interface AdminBusinessListItem {
  id: string
  name: string
  slug: string
  category: string
  email: string | null
  phone: string | null
  createdAt: string
  servicesCount: number
  appointmentsCount: number
}

export interface AdminBusinessDetail {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logo: string | null
  coverPhoto: string | null
  coverVideo: string | null
  coverPhotoMobile: string | null
  coverVideoMobile: string | null
  theme: string
  primaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  settings: {
    paymentRequired: boolean
    paymentOptionalEnabled?: boolean
    paymentType: string | null
    depositPercentage: number | null
    mercadoPagoPublicKey?: string | null
    mercadoPagoWebhookSecret?: string | null
    freeCancellationWindow: number | null
    cancellationHasCost: boolean
    lateCancellationFee: number | null
  bufferTime: number | null
  slotIntervalMinutes: number
    showServiceConfirmModal?: boolean
    allowMultipleServices?: boolean
  } | null
  owner: { id: string; email: string } | null
}

export type CreateBusinessBody = {
  name: string
  slug: string
  category: string
  description?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo?: string | null
  coverPhoto?: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
  theme?: 'DARK' | 'LIGHT'
  primaryColor?: string
  paymentRequired: boolean
  paymentOptionalEnabled?: boolean
  paymentType?: 'PERCENTAGE' | 'FULL'
  depositPercentage?: number | null
  mercadoPagoPublicKey?: string | null
  mercadoPagoAccessToken?: string | null
  mercadoPagoWebhookSecret?: string | null
  freeCancellationWindow?: number | null
  cancellationHasCost?: boolean
  lateCancellationFee?: number | null
  bufferTime?: number | null
  ownerEmail?: string
  ownerPassword?: string
}

export type UpdateBusinessBody = Partial<CreateBusinessBody> & {
  slotIntervalMinutes?: number
  showServiceConfirmModal?: boolean
  allowMultipleServices?: boolean
}

export interface WorkingHoursItem {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isClosed: boolean
  lunchStart: string | null
  lunchEnd: string | null
}

export interface AdminEmployeeListItem {
  id: string
  name: string
  photoUrl: string | null
  isOwner: boolean
}

export interface OwnerEmployeeListItem {
  id: string
  name: string
  photoUrl: string | null
  isOwner: boolean
  staffEmail: string | null
  ownerCalendarColorId: string | null
}

export type EmployeeServiceDurationItem = {
  id: string
  employeeId: string
  serviceId: string | null
  subServiceId: string | null
  duration: number
}

export type EmployeeServiceRestrictionItem = {
  id: string
  employeeId: string
  serviceId: string | null
  subServiceId: string | null
}

// Seller (platform) - reduced business management
export interface SellerBusinessListItem {
  id: string
  name: string
  slug: string
  category: string
  email: string | null
  phone: string | null
  createdAt: string
  appointmentsCount: number
}

export interface SellerBusinessDetail {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  logo: string | null
  coverPhoto: string | null
  coverVideo: string | null
  coverPhotoMobile: string | null
  coverVideoMobile: string | null
  theme: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
  owner: { id: string; email: string } | null
}

export type CreateSellerBusinessBody = Omit<CreateBusinessBody, 'paymentRequired'>
export type UpdateSellerBusinessBody = Partial<CreateSellerBusinessBody>

// Admin: seller management
export interface AdminSellerListItem {
  id: string
  email: string
  name: string | null
  createdAt: string
  businessesCreatedCount: number
}

export interface AdminSellerDetail {
  id: string
  email: string
  name: string | null
  createdAt: string
  businessesCreatedCount: number
  businesses: Array<{
    id: string
    name: string
    slug: string
    category: string
    createdAt: string
  }>
}
