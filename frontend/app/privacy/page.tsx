import Link from "next/link";

export const metadata = {
  title: "Política de privacidad | Turneiro",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 text-gray-900">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Política de privacidad
      </h1>
      <p className="mt-2 text-sm text-gray-500">Última actualización: 2026-03-18</p>

      <section className="mt-8 space-y-4 text-gray-700 leading-relaxed">
        <p>
          Turneiro (&quot;nosotros&quot;) ofrece una plataforma de gestión de turnos para negocios y
          reservas online para clientes. Esta política describe qué datos recopilamos, cómo los
          usamos y tus derechos.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Datos que recopilamos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Datos de cuenta (por ejemplo: nombre, email) cuando te registrás o iniciás sesión.
          </li>
          <li>
            Datos de reserva (por ejemplo: servicio, fecha/hora, negocio/empleado) necesarios para
            gestionar turnos.
          </li>
          <li>
            Datos de contacto (por ejemplo: teléfono) si los ingresás para coordinar una reserva.
          </li>
          <li>
            Datos técnicos (por ejemplo: IP aproximada, navegador, logs) para seguridad y mejora del
            servicio.
          </li>
        </ul>

        <h2 className="pt-4 font-semibold text-gray-900">Cómo usamos tus datos</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Proveer y operar la plataforma (crear/gestionar turnos, notificaciones).</li>
          <li>Seguridad, prevención de fraude y cumplimiento.</li>
          <li>Mejoras del producto y soporte.</li>
        </ul>

        <h2 className="pt-4 font-semibold text-gray-900">Compartición</h2>
        <p>
          Podemos compartir información con el negocio donde reservás (para que pueda gestionar tu
          turno) y con proveedores necesarios para operar el servicio (por ejemplo, infraestructura).
          No vendemos tu información personal.
        </p>

        <h2 className="pt-4 font-semibold text-gray-900">Tus derechos</h2>
        <p>
          Podés solicitar acceso, corrección o eliminación de tus datos, o hacer consultas sobre
          privacidad contactándonos.
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
        <Link href="/terms" className="underline underline-offset-4 hover:text-gray-800">
          Ver términos del servicio
        </Link>
      </div>
    </main>
  );
}

