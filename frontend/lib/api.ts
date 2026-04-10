import axios from 'axios'
import { getAuthToken, getAuthUser, getAdminActingShopSlug } from './auth'
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
  OwnerEmployeeListItem,
  SubServiceAdminItem,
  SellerBusinessDetail,
  SellerBusinessListItem,
  CreateSellerBusinessBody,
  UpdateSellerBusinessBody,
  AdminSellerListItem,
  AdminSellerDetail,
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
  const user = getAuthUser()
  const actingSlug = getAdminActingShopSlug()
  if (user?.role === 'ADMIN' && actingSlug) {
    config.headers['X-Admin-Acting-As-Slug'] = actingSlug
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export type MyBusinessInfo = { name: string; slug: string; logo: string | null }

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
  body: {
    name?: string
    price?: number
    duration?: number
    isActive?: boolean
    shortDescription?: string | null
    description?: string | null
    images?: string[]
  }
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

export async function getSubServices(
  serviceId: string
): Promise<SubServiceAdminItem[]> {
  const { data } = await api.get<SubServiceAdminItem[]>(`/services/${serviceId}/subservices`)
  return data
}

export async function createSubService(
  serviceId: string,
  body: CreateSubServiceAdminBody
): Promise<SubServiceAdminItem> {
  const { data } = await api.post<SubServiceAdminItem>(
    `/services/${serviceId}/subservices`,
    body
  )
  return data
}

export async function updateSubService(
  subServiceId: string,
  body: UpdateSubServiceAdminBody
): Promise<SubServiceAdminItem> {
  const { data } = await api.patch<SubServiceAdminItem>(
    `/services/subservices/${subServiceId}`,
    body
  )
  return data
}

export async function deleteSubService(subServiceId: string): Promise<void> {
  await api.delete(`/services/subservices/${subServiceId}`)
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

// Employees (owner dashboard)
export async function getOwnerEmployees(): Promise<OwnerEmployeeListItem[]> {
  const { data } = await api.get<OwnerEmployeeListItem[]>('/businesses/employees')
  return data
}

export async function getOwnerCalendarColor(): Promise<{ ownerCalendarColorId: string | null }> {
  const { data } = await api.get<{ ownerCalendarColorId: string | null }>(
    '/businesses/owner-calendar-color'
  )
  return data
}

export async function updateOwnerCalendarColor(body: {
  ownerCalendarColorId?: string | null
}): Promise<{ ownerCalendarColorId: string | null }> {
  const { data } = await api.patch<{ ownerCalendarColorId: string | null }>(
    '/businesses/owner-calendar-color',
    body
  )
  return data
}

export async function createOwnerEmployee(body: {
  name: string
  photoUrl?: string | null
  staffEmail: string
  staffPassword: string
  ownerCalendarColorId?: string | null
}): Promise<OwnerEmployeeListItem> {
  const { data } = await api.post<OwnerEmployeeListItem>('/businesses/employees', body)
  return data
}

export async function updateOwnerEmployee(
  employeeId: string,
  body: {
    name?: string
    photoUrl?: string | null
    staffEmail?: string
    staffPassword?: string
    ownerCalendarColorId?: string | null
  }
): Promise<OwnerEmployeeListItem> {
  const { data } = await api.patch<OwnerEmployeeListItem>(`/businesses/employees/${employeeId}`, body)
  return data
}

export async function deleteOwnerEmployee(employeeId: string): Promise<void> {
  await api.delete(`/businesses/employees/${employeeId}`)
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

export async function getAdminSubServices(
  serviceId: string
): Promise<SubServiceAdminItem[]> {
  const { data } = await api.get<SubServiceAdminItem[]>(`/admin/services/${serviceId}/subservices`)
  return data
}

export type CreateServiceAdminBody = {
  name: string
  price: number
  duration: number
  isActive?: boolean
  shortDescription?: string | null
  description?: string | null
  images?: string[]
}

export type UpdateServiceAdminBody = {
  name?: string
  price?: number
  duration?: number
  isActive?: boolean
  shortDescription?: string | null
  description?: string | null
  images?: string[]
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

export type CreateSubServiceAdminBody = {
  name: string
  price: number
  duration: number
  isActive?: boolean
  shortDescription?: string | null
  description?: string | null
  images?: string[]
}

export type UpdateSubServiceAdminBody = {
  name?: string
  price?: number
  duration?: number
  isActive?: boolean
  shortDescription?: string | null
  description?: string | null
  images?: string[]
}

export async function createAdminSubService(
  serviceId: string,
  body: CreateSubServiceAdminBody
): Promise<SubServiceAdminItem> {
  const { data } = await api.post<SubServiceAdminItem>(
    `/admin/services/${serviceId}/subservices`,
    body
  )
  return data
}

export async function updateAdminSubService(
  subServiceId: string,
  body: UpdateSubServiceAdminBody
): Promise<SubServiceAdminItem> {
  const { data } = await api.patch<SubServiceAdminItem>(
    `/admin/subservices/${subServiceId}`,
    body
  )
  return data
}

export async function deleteAdminSubService(subServiceId: string): Promise<void> {
  await api.delete(`/admin/subservices/${subServiceId}`)
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

type CloudinaryDirectSignPayload = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  resourceType: 'image' | 'video'
}

/** Browser → Cloudinary direct (avoids Vercel ~4.5MB request body limit on the API). */
const MAX_DIRECT_UPLOAD_BYTES = 100 * 1024 * 1024

async function uploadFileViaCloudinaryDirect(
  file: File,
  signPath: '/admin/upload/signature' | '/seller/upload/signature'
): Promise<{ url: string }> {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('Solo se permiten imágenes o videos')
  }
  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error('El archivo no debe superar 100 MB')
  }
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
  const { data: sig } = await api.post<CloudinaryDirectSignPayload>(signPath, { resourceType })
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.apiKey)
  formData.append('timestamp', String(sig.timestamp))
  formData.append('signature', sig.signature)
  formData.append('folder', sig.folder)
  const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`
  const res = await fetch(uploadUrl, { method: 'POST', body: formData })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: { message?: string } }
      | { error?: string }
      | null
    const msg =
      body && typeof body === 'object' && body.error
        ? typeof body.error === 'string'
          ? body.error
          : body.error?.message
        : null
    throw new Error(msg || 'Error al subir el archivo')
  }
  const data = (await res.json()) as { secure_url: string }
  return { url: data.secure_url }
}

export async function uploadAdminFile(file: File): Promise<{ url: string }> {
  return uploadFileViaCloudinaryDirect(file, '/admin/upload/signature')
}

// Seller platform
export async function getSellerBusinesses(): Promise<SellerBusinessListItem[]> {
  const { data } = await api.get<SellerBusinessListItem[]>('/seller/businesses')
  return data
}

export async function getSellerBusiness(id: string): Promise<SellerBusinessDetail> {
  const { data } = await api.get<SellerBusinessDetail>(`/seller/businesses/${id}`)
  return data
}

export async function createSellerBusiness(
  body: CreateSellerBusinessBody
): Promise<{ id: string; slug: string }> {
  const { data } = await api.post<{ id: string; slug: string }>('/seller/businesses', body)
  return data
}

export async function updateSellerBusiness(
  id: string,
  body: UpdateSellerBusinessBody
): Promise<{ ok: boolean }> {
  const { data } = await api.patch<{ ok: boolean }>(`/seller/businesses/${id}`, body)
  return data
}

export async function uploadSellerFile(file: File): Promise<{ url: string }> {
  return uploadFileViaCloudinaryDirect(file, '/seller/upload/signature')
}

// Admin: sellers
export async function getAdminSellers(): Promise<AdminSellerListItem[]> {
  const { data } = await api.get<AdminSellerListItem[]>('/admin/sellers')
  return data
}

export async function createAdminSeller(body: {
  email: string
  password: string
  name?: string | null
}): Promise<{ id: string; email: string }> {
  const { data } = await api.post<{ id: string; email: string }>('/admin/sellers', body)
  return data
}

export async function getAdminSellerDetail(id: string): Promise<AdminSellerDetail> {
  const { data } = await api.get<AdminSellerDetail>(`/admin/sellers/${id}`)
  return data
}

export async function deleteAdminSeller(id: string): Promise<void> {
  await api.delete(`/admin/sellers/${id}`)
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
  logo: string | null
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
  logo?: string | null
  coverPhoto?: string | null
  coverVideo?: string | null
  coverPhotoMobile?: string | null
  coverVideoMobile?: string | null
}): Promise<BusinessImages> {
  const { data } = await api.patch<BusinessImages>('/businesses/images', body)
  return data
}

export type BusinessSettings = {
  fontFamily: string
  /** Default light/dark for the public booking page (visitor can still toggle). */
  theme: 'DARK' | 'LIGHT'
  paymentRequired: boolean
  paymentOptionalEnabled: boolean
  paymentType: 'PERCENTAGE' | 'FULL' | null
  depositPercentage: number | null
  mercadoPagoPublicKey: string | null
  hasMercadoPagoAccessToken: boolean
  mercadoPagoWebhookSecret: string | null
  showServiceConfirmModal: boolean
  publicPageBackgroundDark: string | null
  publicPageBackgroundLight: string | null
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data } = await api.get<BusinessSettings>('/businesses/settings')
  return data
}

export async function updateBusinessSettings(
  body: Partial<BusinessSettings> & { mercadoPagoAccessToken?: string | null }
): Promise<BusinessSettings> {
  const { data } = await api.patch<BusinessSettings>('/businesses/settings', body)
  return data
}
