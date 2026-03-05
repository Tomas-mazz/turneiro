import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import type {
  CreateEmployeeAdminInput,
  UpdateEmployeeAdminInput,
} from '../lib/schemas'

export interface EmployeeListItem {
  id: string
  name: string
  photoUrl: string | null
  isOwner: boolean
}

/**
 * Get the Employee id linked to a STAFF user (for dashboard / cancel / calendar scoping).
 * Returns null if the user is not linked to an employee or businessId doesn't match.
 */
export async function getEmployeeIdByUserIdService(
  userId: string,
  businessId: string
): Promise<string | null> {
  const employee = await prisma.employee.findFirst({
    where: { userId, businessId },
    select: { id: true },
  })
  return employee?.id ?? null
}

/**
 * Get the Employee id marked as owner for a given business (used to scope
 * the owner's personal calendar when blocking hours).
 * Returns null if there is no owner-employee configured.
 */
export async function getOwnerEmployeeIdForBusinessService(
  businessId: string
): Promise<string | null> {
  const employee = await prisma.employee.findFirst({
    where: { businessId, isOwner: true },
    select: { id: true },
  })
  return employee?.id ?? null
}

export async function getEmployeesForBusinessService(
  businessId: string
): Promise<EmployeeListItem[]> {
  const employees = await prisma.employee.findMany({
    where: { businessId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      isOwner: true,
    },
  })
  return employees
}

export class EmployeeNotFoundError extends Error {
  constructor(message: string = 'Empleado no encontrado') {
    super(message)
    this.name = 'EmployeeNotFoundError'
  }
}

export async function createEmployeeForAdmin(
  businessId: string,
  data: CreateEmployeeAdminInput
): Promise<EmployeeListItem> {
  const { name, photoUrl, staffEmail, staffPassword, isOwner } = data

  const employee = await prisma.$transaction(async (tx) => {
    if (isOwner) {
      // Ensure there is only one owner-employee per business
      await tx.employee.updateMany({
        where: { businessId, isOwner: true },
        data: { isOwner: false },
      })
    }

    const createdEmployee = await tx.employee.create({
      data: {
        businessId,
        name: name.trim(),
        photoUrl,
        isOwner: !!isOwner,
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        isOwner: true,
      },
    })

    // Optional: create STAFF user for this employee so they can access /dashboard
    if (staffEmail && staffEmail.trim() && staffPassword && staffPassword.length >= 6) {
      const email = staffEmail.trim().toLowerCase()
      const existingUser = await tx.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        throw new Error('El email del empleado ya está en uso')
      }
      const hashed = await bcrypt.hash(staffPassword, 10)
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashed,
          role: 'STAFF',
          businessId,
        },
        select: { id: true },
      })
      await tx.employee.update({
        where: { id: createdEmployee.id },
        data: { userId: newUser.id },
      })
    }

    return createdEmployee
  })

  return employee
}

export async function updateEmployeeForAdmin(
  employeeId: string,
  data: UpdateEmployeeAdminInput
): Promise<EmployeeListItem> {
  const existing = await prisma.employee.findUnique({
    where: { id: employeeId },
  })
  if (!existing) {
    throw new EmployeeNotFoundError('Empleado no encontrado')
  }
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
    },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      isOwner: true,
    },
  })
  return updated
}

export async function deleteEmployeeForAdmin(employeeId: string): Promise<void> {
  const existing = await prisma.employee.findUnique({
    where: { id: employeeId },
  })
  if (!existing) {
    throw new EmployeeNotFoundError('Empleado no encontrado')
  }
  await prisma.$transaction(async (tx) => {
    if (existing.userId) {
      await tx.user.delete({
        where: { id: existing.userId },
      })
    }
    await tx.employee.delete({
      where: { id: employeeId },
    })
  })
}

