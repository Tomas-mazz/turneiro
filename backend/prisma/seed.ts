/// <reference types="node" />
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_SLUG = 'barberia-demo'
const DEMO_OWNER_EMAIL = 'owner@demo.com'
const DEMO_OWNER_PASSWORD = 'demo123'

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
    },
    update: {},
  })

  await prisma.businessSettings.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      freeCancellationWindow: 24,
      requireRegistrationBeforePayment: true,
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

  let service = await prisma.service.findFirst({ where: { businessId: business.id } })
  if (!service) {
    service = await prisma.service.create({
      data: {
        businessId: business.id,
        name: 'Corte',
        price: 500,
        duration: 30,
        isActive: true,
      },
    })
    console.log('Servicio de demo creado: Corte')
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
  console.log('  Email:    ', DEMO_OWNER_EMAIL)
  console.log('  Password: ', DEMO_OWNER_PASSWORD)
  console.log('  Dashboard: http://localhost:3000/dashboard')
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
