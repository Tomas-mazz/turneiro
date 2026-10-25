export type Employee = {
  id: string
  name: string
  photoUrl: string | null
  bio?: string | null
  isOwner: boolean
}

export type IndustryCapabilitiesPublic = {
  allowSubServices: boolean
  allowBrandingAdvanced: boolean
  allowServiceAddOns: boolean
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
  whatsapp?: string | null
  instagram?: string | null
  facebook?: string | null
  mapsUrl?: string | null
  googleReviewsUrl?: string | null
  galleryImages?: string[]
  services: {
    id: string
    name: string
    price: number
    duration: number
    estimatedDurationMin?: number
    estimatedDurationMax?: number
    shortDescription?: string | null
    description?: string | null
    images?: string[]
    subServices?: {
      id: string
      name: string
      price: number
      duration: number
      estimatedDurationMin?: number
      estimatedDurationMax?: number
      shortDescription?: string | null
      description?: string | null
      images?: string[]
    }[]
  }[]
  workingHours: {
    dayOfWeek: number
    startTime: string
    endTime: string
    lunchStart?: string | null
    lunchEnd?: string | null
    isClosed: boolean
  }[]
  employees: Employee[]
  capabilities?: IndustryCapabilitiesPublic
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
  /** Selected adicionales (wellness/salón); IDs sent on booking. */
  addOns?: { id: string; name: string; price: number }[]
}

export type CreatedAppointment = {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  cancellationToken: string | null
}
