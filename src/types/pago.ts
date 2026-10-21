import type { Moneda } from '@/types/presupuesto'

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
]

export interface Pago {
  id: string
  presupuestoId: string
  clienteId: string
  clienteNombre: string
  fecha: string
  /** Lo que efectivamente se cobró (ya actualizado), en la moneda del presupuesto. */
  monto: number
  moneda: Moneda
  /** Etapa del plan de pagos que cancela ('' si no se asignó). */
  etapaId: string
  /** Parte del presupuesto (a valores del mes base) que cancela este pago: monto / coeficiente. */
  montoBase: number
  /** Mes del índice CAC aplicado (`YYYY-MM`); vacío si no hubo actualización. */
  mesIndice: string
  /** Índice del mes aplicado / índice del mes base (nunca menor que 1). 1 si no hubo actualización. */
  coeficiente: number
  /** Valores de los índices usados, guardados para que el recibo no cambie si se corrige la tabla. */
  indiceBase: number
  indiceAplicado: number
  metodo: MetodoPago
  notas: string
  /** Número correlativo de recibo. 0 en pagos viejos: se asigna al emitir el primer recibo. */
  numeroRecibo: number
  createdAt: number
}

export type PagoInput = Omit<Pago, 'id' | 'createdAt' | 'numeroRecibo'>

export function metodoLabel(metodo: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo
}
