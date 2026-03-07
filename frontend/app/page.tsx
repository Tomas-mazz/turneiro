import Link from "next/link";
import { SettingsIcon, CalendarIcon, UserIcon } from "@/app/_assets/icons";

const sections = [
  {
    title: "Admin",
    description: "Panel de administración. Gestión de negocios, usuarios y turnos.",
    href: "/admin",
    icon: <SettingsIcon className="size-8" />,
  },
  {
    title: "Configuración",
    description: "Panel para empleados y dueños. Gestión de servicios y agenda.",
    href: "/setting",
    icon: <CalendarIcon className="size-8" />,
  },
  {
    title: "Reservar turno",
    description: "Buscá tu negocio y reservá un turno como cliente.",
    href: "/demo",
    icon: <UserIcon className="size-8" />,
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-16">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Appointments Platform
      </h1>
      <p className="mt-4 max-w-md text-center text-lg text-gray-500">
        Seleccioná a qué sección querés acceder
      </p>

      <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
          >
            <span className="mb-4 flex size-14 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors group-hover:bg-gray-700">
              {s.icon}
            </span>
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {s.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
