import type { MontosPorMoneda as Montos } from '@/lib/cobros'
import { formatCurrency } from '@/lib/utils'

/** Muestra un total por moneda: pesos siempre, dólares solo si hay montos en dólares. */
export function MontosPorMoneda({ montos, className }: { montos: Montos; className?: string }) {
  return (
    <div className={className}>
      <p className="text-2xl font-semibold">{formatCurrency(montos.ARS, 'ARS')}</p>
      {montos.USD !== 0 && <p className="text-xl font-semibold">{formatCurrency(montos.USD, 'USD')}</p>}
    </div>
  )
}
