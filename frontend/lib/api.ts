import axios from 'axios'
import { getAuthToken } from './auth'
import type {
  ServiceListItem,
  AppointmentListItem,
  BlockedSlotListItem,
  AdminBusinessListItem,
  AdminBusinessDetail,
  CreateBusinessBody,
  UpdateBusinessBody,
  WorkingHoursItem,
  AdminAppointmentListItem,
  AdminEmployeeListItem,
} from '@/types'

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

export type MyBusinessInfo = { name: string; slug: string }

export async function getMyBusiness(): Promise<MyBusinessInfo> {
  const { data } = await api.get<MyBusinessInfo>('/businesses/mine')
  return data
}

export async function getServices(): Promise<ServiceListItem[]> {
  const { data } = await api.get<ServiceListItem[]>('/services')
  return data
}

export async function updateService(
  id: string,
  body: { price?: number; duration?: number; isActive?: boolean }
): Promise<ServiceListItem> {
  const { data } = await api.patch<ServiceListItem>(`/services/${id}`, body)
  return data
}

export type CreateServiceBody = {
  name: string
  price: number
  duration: number
  isActive?: boolean
}

export async function createService(body: CreateServiceBody): Promise<ServiceListItem> {
  const { data } = await api.post<ServiceListItem>('/services', body)
  return data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`)
}

export async function getAppointments(): Promise<AppointmentListItem[]> {
  const { data } = await api.get<AppointmentListItem[]>('/appointments')
  return data
}

export async function getAppointmentsByPhone(
  phone: string
): Promise<AppointmentListItem[]> {
  const { data } = await api.get<AppointmentListItem[]>(
    '/appointments/lookup',
    { params: { phone: phone.trim() } }
  )
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

export async function getGoogleCalendarAuthUrl(returnUrl?: string): Promise<{ authUrl: string }> {
  const { data } = await api.get<{ authUrl: string }>('/google-calendar/auth', {
    params: returnUrl ? { returnUrl } : undefined,
  })
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

// Blocked slots (owner dashboard)
export async function getBlockedSlots(params?: {
  from?: string
  to?: string
}): Promise<BlockedSlotListItem[]> {
  const { data } = await api.get<BlockedSlotListItem[]>('/blocked-slots', { params })
  return data
}

export type CreateBlockedSlotBody = {
  date: string
  type: 'FULL_DAY' | 'TIME_SLOT'
  startTime?: string
  endTime?: string
  reason?: string
  scope?: 'BUSINESS' | 'SELF'
}

export async function createBlockedSlot(
  body: CreateBlockedSlotBody
): Promise<BlockedSlotListItem> {
  const { data } = await api.post<BlockedSlotListItem>('/blocked-slots', body)
  return data
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  await api.delete(`/blocked-slots/${id}`)
}

export async function getAdminBusinesses(): Promise<AdminBusinessListItem[]> {
  const { data } = await api.get<AdminBusinessListItem[]>('/admin/businesses')
  return data
}

export async function getAdminBusiness(id: string): Promise<AdminBusinessDetail> {
  const { data } = await api.get<AdminBusinessDetail>(`/admin/businesses/${id}`)
  return data
}

export async function getAdminBusinessServices(businessId: string): Promise<ServiceListItem[]> {
  const { data } = await api.get<ServiceListItem[]>(`/admin/businesses/${businessId}/services`)
  return data
}

export type CreateServiceAdminBody = {
  name: string
  price: number
  duration: number
  isActive?: boolean
}

export type UpdateServiceAdminBody = {
  name?: string
  price?: number
  duration?: number
  isActive?: boolean
}

export async function createAdminService(
  businessId: string,
  body: CreateServiceAdminBody
): Promise<ServiceListItem> {
  const { data } = await api.post<ServiceListItem>(`/admin/businesses/${businessId}/services`, body)
  return data
}

export async function updateAdminService(
  serviceId: string,
  body: UpdateServiceAdminBody
): Promise<ServiceListItem> {
  const { data } = await api.patch<ServiceListItem>(`/admin/services/${serviceId}`, body)
  return data
}

export async function deleteAdminService(serviceId: string): Promise<void> {
  await api.delete(`/admin/services/${serviceId}`)
}

export async function getAdminWorkingHours(businessId: string): Promise<WorkingHoursItem[]> {
  const { data } = await api.get<WorkingHoursItem[]>(`/admin/businesses/${businessId}/working-hours`)
  return data
}

export async function updateAdminWorkingHours(
  businessId: string,
  hours: WorkingHoursItem[]
): Promise<WorkingHoursItem[]> {
  const { data } = await api.put<WorkingHoursItem[]>(`/admin/businesses/${businessId}/working-hours`, {
    hours,
  })
  return data
}

// Working hours (owner dashboard)
export async function getWorkingHours(): Promise<WorkingHoursItem[]> {
  const { data } = await api.get<WorkingHoursItem[]>('/working-hours')
  return data
}

export async function updateWorkingHours(
  hours: WorkingHoursItem[]
): Promise<WorkingHoursItem[]> {
  const { data } = await api.put<WorkingHoursItem[]>('/working-hours', { hours })
  return data
}

export async function createAdminBusiness(
  body: CreateBusinessBody
): Promise<{ id: string; slug: string }> {
  const { data } = await api.post<{ id: string; slug: string }>('/admin/businesses', body)
  return data
}

export async function updateAdminBusiness(
  id: string,
  body: UpdateBusinessBody
): Promise<{ ok: boolean }> {
  const { data } = await api.patch<{ ok: boolean }>(`/admin/businesses/${id}`, body)
  return data
}

export async function deleteAdminBusiness(businessId: string): Promise<void> {
  await api.delete(`/admin/businesses/${businessId}`)
}

export async function getAdminBlockedSlots(
  businessId: string,
  params?: { from?: string; to?: string }
): Promise<BlockedSlotListItem[]> {
  const { data } = await api.get<BlockedSlotListItem[]>(
    `/admin/businesses/${businessId}/blocked-slots`,
    { params }
  )
  return data
}

export async function createAdminBlockedSlot(
  businessId: string,
  body: CreateBlockedSlotBody
): Promise<BlockedSlotListItem> {
  const { data } = await api.post<BlockedSlotListItem>(
    `/admin/businesses/${businessId}/blocked-slots`,
    body
  )
  return data
}

export async function deleteAdminBlockedSlot(blockId: string): Promise<void> {
  await api.delete(`/admin/blocked-slots/${blockId}`)
}

export async function uploadAdminFile(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export type CreateEmployeeAdminBody = {
  name: string
  photoUrl?: string
  // Optional: when provided, backend creates a STAFF user so this employee can log into /setting
  staffEmail?: string
  staffPassword?: string
  // Optional: mark employee as the business owner (special handling in UI)
  isOwner?: boolean
}

export type UpdateEmployeeAdminBody = {
  name?: string
  photoUrl?: string | null
}

export async function getAdminEmployees(
  businessId: string
): Promise<AdminEmployeeListItem[]> {
  const { data } = await api.get<AdminEmployeeListItem[]>(
    `/admin/businesses/${businessId}/employees`
  )
  return data
}

export async function createAdminEmployee(
  businessId: string,
  body: CreateEmployeeAdminBody
): Promise<AdminEmployeeListItem> {
  const { data } = await api.post<AdminEmployeeListItem>(
    `/admin/businesses/${businessId}/employees`,
    body
  )
  return data
}

export async function updateAdminEmployee(
  employeeId: string,
  body: UpdateEmployeeAdminBody
): Promise<AdminEmployeeListItem> {
  const { data } = await api.patch<AdminEmployeeListItem>(
    `/admin/employees/${employeeId}`,
    body
  )
  return data
}

export async function deleteAdminEmployee(employeeId: string): Promise<void> {
  await api.delete(`/admin/employees/${employeeId}`)
}

export type AdminAppointmentsQuery = {
  businessId?: string
  dateFrom?: string
  dateTo?: string
  status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
}

export async function getAdminAppointments(
  params?: AdminAppointmentsQuery
): Promise<AdminAppointmentListItem[]> {
  const { data } = await api.get<AdminAppointmentListItem[]>('/admin/appointments', {
    params,
  })
  return data
}

export async function adminCancelAppointment(
  id: string,
  reason: string
): Promise<{ cancelled: boolean; id: string; refunded: boolean }> {
  const { data } = await api.post<{ cancelled: boolean; id: string; refunded: boolean }>(
    `/admin/appointments/${id}/cancel`,
    { reason }
  )
  return data
}

export async function adminUpdateAppointmentStatus(
  id: string,
  status: 'UPCOMING' | 'COMPLETED'
): Promise<{ id: string; status: string }> {
  const { data } = await api.patch<{ id: string; status: string }>(
    `/admin/appointments/${id}/status`,
    { status }
  )
  return data
}

export interface MyProfile {
  id: string
  name: string
  photoUrl: string | null
}

export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await api.get<MyProfile>('/businesses/profile')
  return data
}

export async function updateMyProfile(body: { name?: string; photoUrl?: string | null }): Promise<MyProfile> {
  const { data } = await api.patch<MyProfile>('/businesses/profile', body)
  return data
}

export interface BusinessImages {
  coverPhoto: string | null
  coverVideo: string | null
  coverPhotoMobile: string | null
  coverVideoMobile: string | null
}

export async function getBusinessImages(): Promise<BusinessImages> {
  const { data } = await api.get<BusinessImages>('/businesses/images')
  return data
}

export async function updateBusinessImages(body: {
  coverPhoto?: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
}): Promise<BusinessImages> {
  const { data } = await api.patch<BusinessImages>('/businesses/images', body)
  return data
}
