export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aprobado' | 'rechazado'

export const ESTADOS_PRESUPUESTO: { value: EstadoPresupuesto; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
]

export interface PresupuestoItem {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
}

export interface PresupuestoSeccion {
  id: string
  titulo: string
  items: PresupuestoItem[]
}

export interface Presupuesto {
  id: string
  numero: number
  clienteId: string
  clienteNombre: string
  fecha: string
  validoHasta: string
  estado: EstadoPresupuesto
  secciones: PresupuestoSeccion[]
  notas: string
  createdAt: number
  updatedAt: number
}

export type PresupuestoInput = Omit<Presupuesto, 'id' | 'numero' | 'createdAt' | 'updatedAt'>

export function nuevoItem(): PresupuestoItem {
  return { id: crypto.randomUUID(), descripcion: '', cantidad: 1, precioUnitario: 0 }
}

export function nuevaSeccion(): PresupuestoSeccion {
  return { id: crypto.randomUUID(), titulo: '', items: [nuevoItem()] }
}

export function emptyPresupuestoInput(): PresupuestoInput {
  return {
    clienteId: '',
    clienteNombre: '',
    fecha: new Date().toISOString().slice(0, 10),
    validoHasta: '',
    estado: 'borrador',
    secciones: [nuevaSeccion()],
    notas: '',
  }
}

export function calcularSubtotalSeccion(seccion: PresupuestoSeccion): number {
  return seccion.items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
}

export function calcularTotalPresupuesto(secciones: PresupuestoSeccion[]): number {
  return secciones.reduce((sum, seccion) => sum + calcularSubtotalSeccion(seccion), 0)
}

export function estadoBadgeVariant(estado: EstadoPresupuesto): 'default' | 'primary' | 'success' | 'destructive' {
  switch (estado) {
    case 'aprobado':
      return 'success'
    case 'enviado':
      return 'primary'
    case 'rechazado':
      return 'destructive'
    default:
      return 'default'
  }
}

export function estadoLabel(estado: EstadoPresupuesto): string {
  return ESTADOS_PRESUPUESTO.find((e) => e.value === estado)?.label ?? estado
}
