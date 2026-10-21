import type { Pago } from '@/types/pago'
import { formatCurrency, formatMes } from '@/lib/utils'

/** Monto cobrado y, si hubo actualización, de qué monto base y con qué índice sale. */
export function DetalleMontoPago({ pago }: { pago: Pago }) {
  return (
    <div className="flex flex-col items-end">
      <span>{formatCurrency(pago.monto, pago.moneda)}</span>
      {pago.mesIndice && pago.coeficiente !== 1 && (
        <span className="text-xs text-muted-foreground">
          {formatCurrency(pago.montoBase, pago.moneda)} ×{' '}
          {pago.coeficiente.toLocaleString('es-AR', { maximumFractionDigits: 4 })} (CAC {formatMes(pago.mesIndice)})
        </span>
      )}
    </div>
  )
}
