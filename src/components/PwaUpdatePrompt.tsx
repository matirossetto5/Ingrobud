import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  function close() {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-lg border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:right-4">
      <p className="flex-1 text-sm">
        {needRefresh ? 'Hay una nueva versión disponible.' : 'La app ya está lista para funcionar sin conexión.'}
      </p>
      {needRefresh && (
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      )}
      <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={close}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
