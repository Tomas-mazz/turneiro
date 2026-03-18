import Link from "next/link";

export const metadata = {
  title: "Términos del servicio | Turneiro",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 text-gray-900">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Términos del servicio
      </h1>
      <p className="mt-2 text-sm text-gray-500">Última actualización: 2026-03-18</p>

      <section className="mt-8 space-y-4 text-gray-700 leading-relaxed">
        <p>
          Al usar Turneiro, aceptás estos términos. Si no estás de acuerdo, no uses el servicio.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">El servicio</h2>
        <p>
          Turneiro permite a negocios publicar servicios y disponibilidad, y a clientes reservar
          turnos. El negocio es responsable de la prestación del servicio reservado.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Cuentas y uso</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Debés brindar información veraz y mantener la confidencialidad de tu acceso.</li>
          <li>No podés usar la plataforma para actividades ilegales o abusivas.</li>
        </ul>

        <h2 className="pt-4 font-semibold text-gray-900">Reservas, cambios y cancelaciones</h2>
        <p>
          Las políticas de cambios y cancelación pueden variar según el negocio. Turneiro puede
          ofrecer herramientas para gestionar cancelaciones, pero no garantiza reembolsos ni
          disponibilidad.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Disponibilidad</h2>
        <p>
          El servicio se brinda &quot;tal cual&quot; y puede experimentar interrupciones. Hacemos esfuerzos
          razonables para mantenerlo operativo.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por la ley, Turneiro no será responsable por daños indirectos,
          pérdida de ganancias o disputas entre clientes y negocios.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Contacto</h2>
        <p>
          Email:{" "}
          <a className="underline underline-offset-4" href="mailto:turneiro.info@gmail.com">
            turneiro.info@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-10 flex items-center gap-4 text-sm text-gray-600">
        <Link href="/" className="underline underline-offset-4 hover:text-gray-800">
          Volver al inicio
        </Link>
        <span className="text-gray-300" aria-hidden>
          |
        </span>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-gray-800">
          Ver política de privacidad
        </Link>
      </div>
    </main>
  );
}

