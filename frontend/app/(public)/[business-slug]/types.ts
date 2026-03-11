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
  services: { id: string; name: string; price: number; duration: number }[]
  workingHours: { dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }[]
  employees: Employee[]
  settings: { paymentRequired: boolean; paymentType: string | null; depositPercentage: number | null } | null
}

export type Step = 'hero' | 'service' | 'date' | 'time' | 'form' | 'payment' | 'done'

export type ServiceOption = {
  id: string
  name: string
  price: number
  duration: number
}

export type CreatedAppointment = {
  id: string
  startTime: string
  endTime: string
  serviceName: string
  cancellationToken: string | null
}
