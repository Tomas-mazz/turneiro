import { prisma } from '../lib/prisma'
import type {
  CreateEmployeeAdminInput,
  UpdateEmployeeAdminInput,
} from '../lib/schemas'

export interface EmployeeListItem {
  id: string
  name: string
  photoUrl: string | null
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
  const employee = await prisma.employee.create({
    data: {
      businessId,
      name: data.name.trim(),
      photoUrl: data.photoUrl,
    },
    select: {
      id: true,
      name: true,
      photoUrl: true,
    },
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

