/**
 * Placeholder with the booking page's shape while the business loads.
 * Colors come from the --booking-* vars set by the route layout, so it already matches the shop's theme.
 */

const block = 'animate-pulse rounded-lg bg-[color:var(--booking-control-bg)] motion-reduce:animate-none'
const card =
  'rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)] p-4 shadow-sm md:p-5'

function CardTitle() {
  return <div className={`${block} mb-4 h-6 w-32`} />
}

export function BookingPageSkeleton() {
  return (
    <main
      className="flex min-h-screen w-full flex-col overflow-x-hidden"
      aria-busy="true"
      aria-label="Cargando"
    >
      {/* Cover + floating header */}
      <div className="relative w-full overflow-hidden rounded-b-3xl bg-[color:var(--booking-control-bg)] md:rounded-b-[2.5rem]">
        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-end gap-3 px-4 py-5 md:px-6 lg:max-w-6xl lg:px-8">
            <div className="hidden h-11 w-28 rounded-xl bg-[color:var(--booking-card-bg)] sm:block" />
            <div className="hidden h-11 w-28 rounded-xl bg-[color:var(--booking-card-bg)] sm:block" />
            <div className="h-11 w-11 rounded-xl bg-[color:var(--booking-card-bg)]" />
          </div>
        </div>
        <div className="mx-auto flex min-h-[300px] w-full max-w-4xl animate-pulse flex-col justify-end gap-3 px-4 pb-8 pt-24 motion-reduce:animate-none md:min-h-[400px] md:px-6 md:pb-10 lg:max-w-6xl lg:px-8">
          <div className="h-16 w-16 rounded-2xl bg-[color:var(--booking-card-bg)] md:h-20 md:w-20" />
          <div className="h-9 w-56 rounded-lg bg-[color:var(--booking-card-bg)] md:h-12 md:w-80" />
          <div className="h-4 w-72 max-w-full rounded bg-[color:var(--booking-card-bg)]" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 md:gap-6 md:px-6 md:py-10 lg:max-w-6xl lg:px-8">
        {/* Info bar */}
        <div className={`${block} h-48 w-full rounded-2xl md:mx-auto md:h-14 md:w-[780px]`} />

        {/* Team */}
        <div>
          <div className={`${block} mb-3 h-6 w-48 md:mx-auto`} />
          <div className="flex gap-3 overflow-hidden pt-2 md:justify-center">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="w-32 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--booking-card-border)] bg-[color:var(--booking-card-bg)]"
              >
                <div className="aspect-square w-full animate-pulse bg-[color:var(--booking-control-bg)] motion-reduce:animate-none" />
                <div className="space-y-2 px-3 pb-3 pt-2">
                  <div className={`${block} h-4 w-20`} />
                  <div className={`${block} h-3 w-16`} />
                  <div className={`${block} mx-auto !mt-4 h-3 w-20`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
          {/* Services */}
          <section className={card}>
            <CardTitle />
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className={`${block} h-16 rounded-xl`} />
              ))}
            </div>
          </section>

          {/* Calendar */}
          <section className={card}>
            <CardTitle />
            <div className={`${block} mx-auto mb-4 h-5 w-36`} />
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }, (_, i) => (
                <div key={i} className={`${block} aspect-square`} />
              ))}
            </div>
          </section>

          {/* Summary */}
          <section className={`${card} hidden lg:block`}>
            <CardTitle />
            <div className="space-y-3">
              <div className={`${block} h-4 w-3/4`} />
              <div className={`${block} h-4 w-1/2`} />
            </div>
          </section>
        </div>
      </div>
      <span className="sr-only">Cargando la página de reservas…</span>
    </main>
  )
}
