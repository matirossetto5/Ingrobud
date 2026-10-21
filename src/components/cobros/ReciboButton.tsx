import { useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Pago } from '@/types/pago'
import type { Presupuesto } from '@/types/presupuesto'
import { generarReciboPdf } from '@/lib/reciboPdf'
import { Button } from '@/components/ui/button'

export function ReciboButton({
  pago,
  presupuesto,
  pagos,
}: {
  pago: Pago
  presupuesto: Presupuesto | undefined
  pagos: Pago[]
}) {
  const queryClient = useQueryClient()
  const [generando, setGenerando] = useState(false)

  async function handleClick() {
    setGenerando(true)
    try {
      await generarReciboPdf({ pago, presupuesto, pagos })
      // A los pagos viejos se les asigna número al emitir el primer recibo.
      if (!pago.numeroRecibo) await queryClient.invalidateQueries({ queryKey: ['pagos'] })
    } catch {
      window.alert('No se pudo generar el recibo. Revisá la conexión e intentá de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Descargar recibo" title="Descargar recibo" onClick={handleClick} disabled={generando}>
      <ReceiptText className="h-4 w-4" />
    </Button>
  )
}
