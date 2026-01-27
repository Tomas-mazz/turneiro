// Public booking page
// TODO: Implement booking page logic

export default function BusinessBookingPage({
  params,
}: {
  params: { 'business-slug': string }
}) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Booking Page</h1>
      <p className="mt-4 text-gray-600">
        Business: {params['business-slug']}
      </p>
      <p className="mt-2 text-gray-600">Booking page - Ready to build!</p>
    </main>
  )
}
