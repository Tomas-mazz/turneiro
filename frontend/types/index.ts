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
    paymentType: string | null
    depositPercentage: number | null
    freeCancellationWindow: number | null
    cancellationHasCost: boolean
    lateCancellationFee: number | null
  bufferTime: number | null
  slotIntervalMinutes: number
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
  paymentType?: 'PERCENTAGE' | 'FULL'
  depositPercentage?: number | null
  freeCancellationWindow?: number | null
  cancellationHasCost?: boolean
  lateCancellationFee?: number | null
  bufferTime?: number | null
  ownerEmail?: string
  ownerPassword?: string
}

export type UpdateBusinessBody = Partial<CreateBusinessBody> & {
  slotIntervalMinutes?: number
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
