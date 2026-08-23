import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Wallet, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import icon from '@/assets/brand/icon-dark.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { to: '/cobros', label: 'Cobros', icon: Wallet },
]

export function AppShell() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background p-4 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <img src={icon} alt="" className="h-8 w-8 rounded-md" />
          <span className="text-base font-semibold">Ingroma</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2">
            <img src={icon} alt="" className="h-7 w-7 rounded-md" />
            <span className="font-semibold">Ingroma</span>
          </div>
          <button onClick={() => logout()} aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>

        <nav className="flex items-center justify-around border-t border-border bg-background py-2 sm:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
