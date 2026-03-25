type PaymentMode = 'UNPAID' | 'DEPOSIT' | 'FULL'
type PaymentSummary = { title: string; lines: string[] }

function formatARS(amount: number): string {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function resolvePaymentMode(params: {
  paymentStatus: string
  price: number
  paymentAmount: number | null
}): PaymentMode {
  const { paymentStatus, price, paymentAmount } = params

  if (paymentStatus === 'PAID') {
    if (paymentAmount != null && paymentAmount < price) return 'DEPOSIT'
    return 'FULL'
  }

  return 'UNPAID'
}

export function buildPaymentSummaryLines(params: {
  paymentStatus: string
  price: number
  paymentAmount: number | null
}): PaymentSummary {
  const { paymentStatus, price, paymentAmount } = params

  if (paymentStatus === 'REFUNDED') {
    return {
      title: 'Pago: Reintegrado',
      lines: [`Monto del servicio: $${formatARS(price)}`],
    }
  }

  if (paymentStatus === 'PARTIALLY_REFUNDED') {
    const paid = paymentAmount ?? 0
    return {
      title: 'Pago: Reintegro parcial',
      lines: [`Monto del servicio: $${formatARS(price)}`, `Pagado: $${formatARS(paid)}`],
    }
  }

  const mode = resolvePaymentMode({ paymentStatus, price, paymentAmount })

  if (mode === 'UNPAID') {
    return {
      title: 'Pago: Sin pago',
      lines: [`Monto del servicio: $${formatARS(price)}`],
    }
  }

  if (mode === 'DEPOSIT') {
    const paid = paymentAmount ?? 0
    const remaining = Math.max(price - paid, 0)
    return {
      title: 'Pago: Seña',
      lines: [
        `Monto total: $${formatARS(price)}`,
        `Pagado: $${formatARS(paid)}`,
        `Restante: $${formatARS(remaining)}`,
      ],
    }
  }

  const paid = paymentAmount ?? price
  return {
    title: 'Pago: Pagado',
    lines: [`Monto total: $${formatARS(price)}`, `Pagado: $${formatARS(paid)}`],
  }
}

