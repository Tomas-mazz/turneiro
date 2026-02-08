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
  theme?: 'DARK' | 'LIGHT'
  primaryColor?: string
  paymentRequired: boolean
  ownerEmail?: string
  ownerPassword?: string
}

export type UpdateBusinessBody = Partial<CreateBusinessBody>
