export type Business = {
  id: string
  name: string
  slug: string
  description: string | null
  coverPhoto: string | null
  coverVideo?: string | null
  primaryColor: string
  services: { id: string; name: string; price: number; duration: number }[]
  workingHours: { dayOfWeek: number; startTime: string; endTime: string; isClosed: boolean }[]
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
