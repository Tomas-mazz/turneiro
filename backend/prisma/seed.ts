/// <reference types="node" />
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_SLUG = 'barberia-demo'
const DEMO_OWNER_EMAIL = 'owner@demo.com'
const DEMO_OWNER_PASSWORD = 'demo123'

const ADMIN_EMAIL = 'tmazzucco.dev@gmail.com'
const ADMIN_PASSWORD = 'Aron15576667'

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_OWNER_PASSWORD, 10)

  const business = await prisma.business.upsert({
    where: { slug: DEMO_SLUG },
    create: {
      name: 'Barbería Demo',
      slug: DEMO_SLUG,
      description: 'Negocio de prueba para desarrollo',
      category: 'barbershop',
      primaryColor: '#000000',
      phone: '+54 11 1234-5678',
      email: 'contacto@barberia-demo.com',
      address: 'Av. Demo 123, CABA',
    },
    update: {
      phone: '+54 11 1234-5678',
      email: 'contacto@barberia-demo.com',
      address: 'Av. Demo 123, CABA',
    },
  })

  await prisma.businessSettings.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      paymentRequired: true,
      paymentType: 'PERCENTAGE',
      depositPercentage: 10,
      requireRegistrationBeforePayment: true,
      freeCancellationWindow: 24,
      cancellationHasCost: false,
      bufferTime: 0,
    },
    update: {},
  })

  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_OWNER_EMAIL },
  })

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: DEMO_OWNER_EMAIL,
        password: hashedPassword,
        role: 'OWNER',
        businessId: business.id,
      },
    })
    console.log('Usuario de demo creado:', DEMO_OWNER_EMAIL)
  } else {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword, businessId: business.id },
    })
    console.log('Usuario de demo actualizado:', DEMO_OWNER_EMAIL)
  }

  const adminEmail = ADMIN_EMAIL.toLowerCase().trim()
  const adminHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  })
  if (!adminUser) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminHashedPassword,
        role: 'ADMIN',
        businessId: null,
      },
    })
    console.log('Usuario admin creado:', adminEmail)
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: adminHashedPassword, role: 'ADMIN', businessId: null },
    })
    console.log('Usuario admin actualizado:', adminEmail)
  }

  const demoServiceNames = ['Corte', 'Corte + Barba', 'Barba']
  const demoServices = [
    { name: 'Corte', price: 500, duration: 30 },
    { name: 'Corte + Barba', price: 700, duration: 45 },
    { name: 'Barba', price: 350, duration: 20 },
  ]
  for (const s of demoServices) {
    const existing = await prisma.service.findFirst({
      where: { businessId: business.id, name: s.name },
    })
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { price: s.price, duration: s.duration },
      })
    } else {
      await prisma.service.create({
        data: { businessId: business.id, ...s, isActive: true },
      })
    }
  }
  await prisma.service.deleteMany({
    where: {
      businessId: business.id,
      name: { notIn: demoServiceNames },
    },
  })
  const service = await prisma.service.findFirst({
    where: { businessId: business.id, name: 'Corte' },
  })
  if (!service) throw new Error('Corte service missing after seed')
  console.log('Servicios de demo: Corte, Corte + Barba, Barba')

  const employeeCount = await prisma.employee.count({ where: { businessId: business.id } })
  if (employeeCount === 0) {
    await prisma.employee.createMany({
      data: [
        { businessId: business.id, name: 'Juan' },
        { businessId: business.id, name: 'María' },
        { businessId: business.id, name: 'Carlos' },
      ],
    })
    console.log('Empleados de demo creados: Juan, María, Carlos')
  }

  const hoursCount = await prisma.workingHours.count({ where: { businessId: business.id } })
  if (hoursCount === 0) {
    const days = [1, 2, 3, 4, 5]
    for (const dayOfWeek of days) {
      await prisma.workingHours.create({
        data: {
          businessId: business.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          isClosed: false,
        },
      })
    }
    console.log('Horarios de demo creados: Lun–Vie 09:00–18:00')
  }

  const appointmentCount = await prisma.appointment.count({ where: { businessId: business.id } })
  if (appointmentCount === 0) {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const inTwoDays = new Date(now)
    inTwoDays.setDate(inTwoDays.getDate() + 2)

    const demoAppointments = [
      {
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 30, 0),
        clientName: 'Juan Pérez',
        clientPhone: '+54 11 1234-5678',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
      {
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 30, 0),
        clientName: 'María García',
        clientPhone: '+54 11 8765-4321',
        status: 'UPCOMING',
        paymentStatus: 'PENDING',
      },
      {
        startTime: new Date(inTwoDays.getFullYear(), inTwoDays.getMonth(), inTwoDays.getDate(), 15, 0, 0),
        endTime: new Date(inTwoDays.getFullYear(), inTwoDays.getMonth(), inTwoDays.getDate(), 15, 30, 0),
        clientName: 'Carlos López',
        clientPhone: '4567-8901',
        status: 'UPCOMING',
        paymentStatus: 'PENDING',
      },
    ]

    for (const apt of demoAppointments) {
      await prisma.appointment.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          startTime: apt.startTime,
          endTime: apt.endTime,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone,
          status: apt.status,
          paymentStatus: apt.paymentStatus,
        },
      })
    }
    console.log('Citas de demo creadas:', demoAppointments.length)
  }

  console.log('---')
  console.log('Seed listo. Podés iniciar sesión en el frontend con:')
  console.log('  Owner:    ', DEMO_OWNER_EMAIL, '/', DEMO_OWNER_PASSWORD, '→ /dashboard')
  console.log('  Admin:    ', ADMIN_EMAIL, '→ /admin')
  console.log('  Página pública: http://localhost:3000/' + DEMO_SLUG)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
