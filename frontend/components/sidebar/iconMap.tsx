import type { LucideIcon } from 'lucide-react'
import {
  AlertOctagon,
  Building2,
  Calendar,
  CalendarOff,
  Clock,
  Home,
  Image,
  LayoutDashboard,
  Palette,
  PlusCircle,
  User,
  Briefcase,
  Wallet,
} from 'lucide-react'
import type { SidebarIconKey } from './types'

const map: Record<SidebarIconKey, LucideIcon> = {
  home: Home,
  user: User,
  briefcase: Briefcase,
  clock: Clock,
  calendarOff: CalendarOff,
  wallet: Wallet,
  palette: Palette,
  image: Image,
  alertOctagon: AlertOctagon,
  layoutDashboard: LayoutDashboard,
  building2: Building2,
  calendar: Calendar,
  plusCircle: PlusCircle,
}

export function getSidebarIcon(key: SidebarIconKey): LucideIcon {
  return map[key] ?? LayoutDashboard
}
