import { calcularTotalPresupuesto, type Presupuesto } from '@/types/presupuesto'
import type { Pago } from '@/types/pago'

export interface ResumenCobro {
  presupuesto: Presupuesto
  total: number
  cobrado: number
  saldo: number
}

export function calcularResumenCobros(presupuestos: Presupuesto[], pagos: Pago[]): ResumenCobro[] {
  return presupuestos.map((presupuesto) => {
    const total = calcularTotalPresupuesto(presupuesto.secciones)
    const cobrado = pagos
      .filter((pago) => pago.presupuestoId === presupuesto.id)
      .reduce((sum, pago) => sum + pago.monto, 0)
    return { presupuesto, total, cobrado, saldo: total - cobrado }
  })
}
