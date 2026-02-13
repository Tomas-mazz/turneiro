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
      await tx.user.create({
        data: {
          email,
          password: hashed,
          role: 'STAFF',
          businessId,
        },
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
  await prisma.employee.delete({
    where: { id: employeeId },
  })
}

