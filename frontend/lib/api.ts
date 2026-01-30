import axios from 'axios'
import { getAuthToken } from './auth'
import type { ServiceListItem, AppointmentListItem } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export async function getServices(): Promise<ServiceListItem[]> {
  const { data } = await api.get<ServiceListItem[]>('/services')
  return data
}

export async function updateService(
  id: string,
  body: { price?: number; duration?: number }
): Promise<ServiceListItem> {
  const { data } = await api.patch<ServiceListItem>(`/services/${id}`, body)
  return data
}

export async function getAppointments(): Promise<AppointmentListItem[]> {
  const { data } = await api.get<AppointmentListItem[]>('/appointments')
  return data
}

export async function cancelAppointmentByOwner(
  id: string,
  reason: string
): Promise<{ cancelled: boolean; id: string }> {
  const { data } = await api.post<{ cancelled: boolean; id: string }>(
    `/appointments/${id}/cancel`,
    { reason }
  )
  return data
}

export type GoogleCalendarStatus = { connected: boolean; calendarId: string | null }

export async function getGoogleCalendarAuthUrl(): Promise<{ authUrl: string }> {
  const { data } = await api.get<{ authUrl: string }>('/google-calendar/auth')
  return data
}

export async function getGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  const { data } = await api.get<GoogleCalendarStatus>('/google-calendar/status')
  return data
}

export async function disconnectGoogleCalendar(): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>('/google-calendar/disconnect')
  return data
}
