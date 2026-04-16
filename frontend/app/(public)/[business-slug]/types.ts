export type Employee = {
  id: string
  name: string
  photoUrl: string | null
  isOwner: boolean
}

export type Business = {
  id: string
  name: string
  slug: string
  description: string | null
  logo?: string | null
  coverPhoto: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
  theme?: string
  primaryColor: string
  phone: string | null
  email: string | null
  address: string | null
  services: {
    id: string
    name: string
    price: number
    duration: number
    shortDescription?: string | null
    description?: string | null
    images?: string[]
    subServices?: {
      id: string
      name: string
      price: number
      duration: number
      shortDescription?: string | null
      description?: string | null
      images?: string[]
    }[]
  }[]
  workingHours: { dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }[]
  employees: Employee[]
  settings: {
    fontFamily?: string
    paymentRequired: boolean
    paymentOptionalEnabled?: boolean
    paymentType: string | null
    depositPercentage: number | null
    mercadoPagoPublicKey?: string | null
    showServiceConfirmModal?: boolean
    allowMultipleServices?: boolean
    publicPageBackgroundDark?: string | null
    publicPageBackgroundLight?: string | null
    publicBrandColor?: string | null
    publicBrandIntensity?: 'SOFT' | 'NORMAL' | 'STRONG' | null
    publicUseGradient?: boolean | null
  } | null
}

export type Step = 'hero' | 'service' | 'date' | 'time' | 'form' | 'payment' | 'done'

export type ServiceOption = {
  id: string
  name: string
  price: number
  duration: number
  parentServiceId?: string
  parentServiceName?: string
}

export type CreatedAppointment = {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  cancellationToken: string | null
}
