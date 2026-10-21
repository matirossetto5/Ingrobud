import { actualizaPorCac, type PresupuestoVersion } from '@/types/presupuesto'
import { formatMes } from '@/lib/utils'

/** Cláusula de moneda y actualización que se muestra en el detalle y en el PDF. */
export function textoActualizacion(presupuesto: Pick<PresupuestoVersion, 'moneda' | 'mesBaseCac'>): string {
  if (presupuesto.moneda === 'USD') {
    return 'Montos expresados en dólares estadounidenses. No están sujetos a actualización.'
  }
  if (actualizaPorCac(presupuesto)) {
    return (
      `Montos expresados en pesos a valores de ${formatMes(presupuesto.mesBaseCac)}. ` +
      'Los saldos pendientes se actualizarán al momento de cada pago según la variación del Índice CAC ' +
      '(Cámara Argentina de la Construcción, nivel general) entre el mes base y el último índice publicado. ' +
      'Los montos ya abonados no se actualizan.'
    )
  }
  return 'Montos expresados en pesos argentinos.'
}
