import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { FirebaseSetupNotice } from '@/routes/FirebaseSetupNotice'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status)

  if (status === 'unconfigured') {
    return <FirebaseSetupNotice />
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
