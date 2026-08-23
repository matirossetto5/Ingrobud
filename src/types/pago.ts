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
  monto: number
  metodo: MetodoPago
  notas: string
  createdAt: number
}

export type PagoInput = Omit<Pago, 'id' | 'createdAt'>

export function metodoLabel(metodo: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.value === metodo)?.label ?? metodo
}
