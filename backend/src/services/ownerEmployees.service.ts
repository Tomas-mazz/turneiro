import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { ensureOwnerEmployee } from './ownerEmployee.service'

const GOOGLE_CALENDAR_COLOR_IDS = ['1','2','3','4','5','6','7','8','9','10','11'] as const
type GoogleCalendarColorId = (typeof GOOGLE_CALENDAR_COLOR_IDS)[number]

function pickRandomColorId(): GoogleCalendarColorId {
  return GOOGLE_CALENDAR_COLOR_IDS[Math.floor(Math.random() * GOOGLE_CALENDAR_COLOR_IDS.length)]
}

export type OwnerEmployeeListItem = {
  id: string
  name: string
  photoUrl: string | null
  isOwner: boolean
  staffEmail: string | null
  ownerCalendarColorId: string | null
  bio: string | null
}

export class OwnerEmployeeNotFoundError extends Error {
  constructor(message: string = 'Empleado no encontrado') {
    super(message)
    this.name = 'OwnerEmployeeNotFoundError'
  }
}

export class OwnerEmployeeOperationNotAllowedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OwnerEmployeeOperationNotAllowedError'
  }
}

export async function listOwnerEmployeesService(params: {
  businessId: string
  ownerUserId?: string
  ownerName?: string | null
}): Promise<OwnerEmployeeListItem[]> {
  const { businessId, ownerUserId, ownerName } = params
  await prisma.$transaction(async (tx) => {
    await ensureOwnerEmployee(tx, businessId, {
      ...(ownerUserId ? { ownerUserId } : {}),
      fallbackName: ownerName ?? undefined,
    })
  })

  const employees = await prisma.employee.findMany({
    where: { businessId },
    orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      photoUrl: true,
      bio: true,
      isOwner: true,
      ownerCalendarColorId: true,
      user: { select: { email: true } },
    },
  })

  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    photoUrl: e.photoUrl ?? null,
    isOwner: e.isOwner,
    staffEmail: e.user?.email ?? null,
    ownerCalendarColorId: e.ownerCalendarColorId ?? null,
    bio: e.bio ?? null,
  }))
}

export async function getOwnerCalendarColorService(params: {
  businessId: string
  ownerUserId?: string
  ownerName?: string | null
}): Promise<{ ownerCalendarColorId: string | null }> {
  const { businessId, ownerUserId, ownerName } = params
  await prisma.$transaction(async (tx) => {
    await ensureOwnerEmployee(tx, businessId, {
      ...(ownerUserId ? { ownerUserId } : {}),
      fallbackName: ownerName ?? undefined,
    })
  })

  const ownerEmp = await prisma.employee.findFirst({
    where: { businessId, isOwner: true },
    select: { ownerCalendarColorId: true },
  })
  return { ownerCalendarColorId: ownerEmp?.ownerCalendarColorId ?? null }
}

export async function updateOwnerCalendarColorService(params: {
  businessId: string
  ownerUserId?: string
  ownerName?: string | null
  ownerCalendarColorId: string | null
}): Promise<{ ownerCalendarColorId: string | null }> {
  const { businessId, ownerUserId, ownerName, ownerCalendarColorId } = params
  await prisma.$transaction(async (tx) => {
    await ensureOwnerEmployee(tx, businessId, {
      ...(ownerUserId ? { ownerUserId } : {}),
      fallbackName: ownerName ?? undefined,
    })

    const ownerEmp = await tx.employee.findFirst({
      where: { businessId, isOwner: true },
      select: { id: true },
    })
    if (!ownerEmp) {
      throw new Error('Empleado dueño no encontrado')
    }
    await tx.employee.update({
      where: { id: ownerEmp.id },
      data: {
        ownerCalendarColorId: ownerCalendarColorId?.trim() ? ownerCalendarColorId.trim() : null,
      },
    })
  })

  return { ownerCalendarColorId: ownerCalendarColorId?.trim() ? ownerCalendarColorId.trim() : null }
}

export async function createOwnerEmployeeService(params: {
  businessId: string
  name: string
  photoUrl?: string | null
  staffEmail: string
  staffPassword: string
  ownerCalendarColorId?: string | null
}): Promise<OwnerEmployeeListItem> {
  const { businessId, name, photoUrl, staffEmail, staffPassword, ownerCalendarColorId } = params

  const created = await prisma.$transaction(async (tx) => {
    const email = staffEmail.trim().toLowerCase()
    const existingUser = await tx.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new OwnerEmployeeOperationNotAllowedError('El email del empleado ya está en uso')
    }

    const hashed = await bcrypt.hash(staffPassword, 10)
    const user = await tx.user.create({
      data: {
        email,
        password: hashed,
        role: 'STAFF',
        businessId,
      },
      select: { id: true, email: true },
    })

    const employee = await tx.employee.create({
      data: {
        businessId,
        name: name.trim(),
        photoUrl: photoUrl ?? null,
        isOwner: false,
        userId: user.id,
        ownerCalendarColorId: ownerCalendarColorId?.trim() ? ownerCalendarColorId.trim() : null,
        staffCalendarColorId: pickRandomColorId(),
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        bio: true,
        isOwner: true,
        ownerCalendarColorId: true,
        user: { select: { email: true } },
      },
    })

    return employee
  })

  return {
    id: created.id,
    name: created.name,
    photoUrl: created.photoUrl ?? null,
    isOwner: created.isOwner,
    staffEmail: created.user?.email ?? null,
    ownerCalendarColorId: created.ownerCalendarColorId ?? null,
    bio: created.bio ?? null,
  }
}

export async function updateOwnerEmployeeService(params: {
  businessId: string
  employeeId: string
  name?: string
  photoUrl?: string | null
  ownerCalendarColorId?: string | null
  bio?: string | null
  staffEmail?: string
  staffPassword?: string
}): Promise<OwnerEmployeeListItem> {
  const { businessId, employeeId, name, photoUrl, ownerCalendarColorId, bio, staffEmail, staffPassword } = params
  const bioData = bio !== undefined ? { bio: bio?.trim() || null } : {}

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findFirst({
      where: { id: employeeId, businessId },
      select: { id: true, isOwner: true, userId: true, user: { select: { email: true } } },
    })
    if (!existing) throw new OwnerEmployeeNotFoundError('Empleado no encontrado')

    if (existing.isOwner) {
      // Owner employee: never touch credentials (owner credentials are managed on the Business/OWNER user)
      const employee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(photoUrl !== undefined && { photoUrl }),
          ...(ownerCalendarColorId !== undefined && {
            ownerCalendarColorId: ownerCalendarColorId?.trim() ? ownerCalendarColorId.trim() : null,
          }),
          ...bioData,
        },
        select: {
          id: true,
          name: true,
          photoUrl: true,
          bio: true,
          isOwner: true,
          ownerCalendarColorId: true,
          user: { select: { email: true } },
        },
      })
      return employee
    }

    // STAFF credentials update / creation
    const wantsEmailUpdate = staffEmail !== undefined && staffEmail.trim() !== ''
    const wantsPasswordUpdate = staffPassword !== undefined && staffPassword.trim() !== ''

    if (wantsPasswordUpdate && staffPassword!.length < 6) {
      throw new OwnerEmployeeOperationNotAllowedError('La contraseña debe tener al menos 6 caracteres')
    }

    let nextUserId = existing.userId

    if ((wantsEmailUpdate || wantsPasswordUpdate) && !nextUserId) {
      // Creating credentials for the first time requires both email + password
      if (!wantsEmailUpdate || !wantsPasswordUpdate) {
        throw new OwnerEmployeeOperationNotAllowedError(
          'Para crear acceso al panel del empleado, email y contraseña son obligatorios (mín. 6 caracteres).'
        )
      }
      const email = staffEmail!.trim().toLowerCase()
      const existingUser = await tx.user.findUnique({ where: { email } })
      if (existingUser) {
        throw new OwnerEmployeeOperationNotAllowedError('El email del empleado ya está en uso')
      }
      const hashed = await bcrypt.hash(staffPassword!, 10)
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          role: 'STAFF',
          businessId,
        },
        select: { id: true },
      })
      nextUserId = user.id
      await tx.employee.update({ where: { id: employeeId }, data: { userId: user.id } })
    } else if (nextUserId) {
      if (wantsEmailUpdate) {
        const email = staffEmail!.trim().toLowerCase()
        const collision = await tx.user.findUnique({ where: { email } })
        if (collision && collision.id !== nextUserId) {
          throw new OwnerEmployeeOperationNotAllowedError('El email del empleado ya está en uso')
        }
        await tx.user.update({ where: { id: nextUserId }, data: { email } })
      }
      if (wantsPasswordUpdate) {
        const hashed = await bcrypt.hash(staffPassword!, 10)
        await tx.user.update({ where: { id: nextUserId }, data: { password: hashed } })
      }
    }

    const employee = await tx.employee.update({
      where: { id: employeeId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(ownerCalendarColorId !== undefined && {
          ownerCalendarColorId: ownerCalendarColorId?.trim() ? ownerCalendarColorId.trim() : null,
        }),
        ...(existing.userId && !existing.isOwner ? {} : {}),
        ...bioData,
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        bio: true,
        isOwner: true,
        ownerCalendarColorId: true,
        user: { select: { email: true } },
      },
    })

    // Ensure staff calendar color exists (random by default)
    const needsStaffColor = await tx.employee.findFirst({
      where: { id: employeeId },
      select: { staffCalendarColorId: true },
    })
    if (!needsStaffColor?.staffCalendarColorId) {
      await tx.employee.update({
        where: { id: employeeId },
        data: { staffCalendarColorId: pickRandomColorId() },
      })
    }

    return employee
  })

  return {
    id: updated.id,
    name: updated.name,
    photoUrl: updated.photoUrl ?? null,
    isOwner: updated.isOwner,
    staffEmail: updated.user?.email ?? null,
    ownerCalendarColorId: updated.ownerCalendarColorId ?? null,
    bio: updated.bio ?? null,
  }
}

export async function deleteOwnerEmployeeService(params: {
  businessId: string
  employeeId: string
}): Promise<void> {
  const { businessId, employeeId } = params
  await prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findFirst({
      where: { id: employeeId, businessId },
      select: { id: true, isOwner: true, userId: true },
    })
    if (!existing) throw new OwnerEmployeeNotFoundError('Empleado no encontrado')
    if (existing.isOwner) {
      throw new OwnerEmployeeOperationNotAllowedError('No podés eliminar el perfil del dueño')
    }
    if (existing.userId) {
      await tx.user.delete({ where: { id: existing.userId } })
    }
    await tx.employee.delete({ where: { id: employeeId } })
  })
}

