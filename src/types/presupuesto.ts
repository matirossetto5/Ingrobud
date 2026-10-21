export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aprobado' | 'rechazado'

export const ESTADOS_PRESUPUESTO: { value: EstadoPresupuesto; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
]

export type Moneda = 'ARS' | 'USD'

export const MONEDAS: { value: Moneda; label: string }[] = [
  { value: 'ARS', label: 'Pesos (ARS) — actualiza por CAC' },
  { value: 'USD', label: 'Dólares (USD) — sin actualización' },
]

/** Etapa del plan de pagos. El monto sale del porcentaje sobre el total, así sobrevive a cambios de precios. */
export interface EtapaPago {
  id: string
  descripcion: string
  porcentaje: number
}

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
  moneda: Moneda
  /** Mes base de la cotización (`YYYY-MM`) para actualizar por índice CAC. Solo aplica en pesos. */
  mesBaseCac: string
  etapasPago: EtapaPago[]
  /** Revisión vigente: 0 es la versión original, cada nueva revisión suma 1. */
  revision: number
  /** Motivo de la revisión vigente (vacío en la revisión 0). */
  motivoRevision: string
  createdAt: number
  updatedAt: number
}

export type PresupuestoInput = Omit<
  Presupuesto,
  'id' | 'numero' | 'revision' | 'motivoRevision' | 'createdAt' | 'updatedAt'
>

/** Copia congelada de una revisión anterior, guardada en `presupuestos/{id}/revisiones/{revision}`. */
export interface PresupuestoRevision {
  revision: number
  motivoRevision: string
  clienteNombre: string
  fecha: string
  validoHasta: string
  estado: EstadoPresupuesto
  secciones: PresupuestoSeccion[]
  notas: string
  moneda: Moneda
  mesBaseCac: string
  etapasPago: EtapaPago[]
  /** Momento en que esta revisión fue reemplazada por la siguiente. */
  archivadaEn: number
}

/** Lo mínimo que hace falta para mostrar o exportar una versión (vigente o archivada). */
export type PresupuestoVersion = Pick<
  Presupuesto,
  | 'numero'
  | 'revision'
  | 'clienteId'
  | 'clienteNombre'
  | 'fecha'
  | 'validoHasta'
  | 'estado'
  | 'secciones'
  | 'notas'
  | 'moneda'
  | 'mesBaseCac'
  | 'etapasPago'
>

export function revisionLabel(revision: number): string {
  return `Rev. ${revision}`
}

export function nuevoItem(): PresupuestoItem {
  return { id: crypto.randomUUID(), descripcion: '', cantidad: 1, precioUnitario: 0 }
}

export function nuevaEtapa(descripcion = '', porcentaje = 0): EtapaPago {
  return { id: crypto.randomUUID(), descripcion, porcentaje }
}

/** Mes anterior a la fecha dada (`YYYY-MM-DD` o `YYYY-MM`), en formato `YYYY-MM`. */
export function mesAnterior(fecha: string): string {
  const [year, month] = fecha.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nuevaSeccion(): PresupuestoSeccion {
  return { id: crypto.randomUUID(), titulo: '', items: [nuevoItem()] }
}

export function emptyPresupuestoInput(): PresupuestoInput {
  const hoy = new Date().toISOString().slice(0, 10)
  return {
    clienteId: '',
    clienteNombre: '',
    fecha: hoy,
    validoHasta: '',
    estado: 'borrador',
    secciones: [nuevaSeccion()],
    notas: '',
    moneda: 'ARS',
    // El último CAC publicado suele ser el del mes anterior.
    mesBaseCac: mesAnterior(hoy),
    etapasPago: [nuevaEtapa('Anticipo', 50), nuevaEtapa('Al finalizar el trabajo', 50)],
  }
}

export function calcularSubtotalSeccion(seccion: PresupuestoSeccion): number {
  return seccion.items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
}

export function calcularTotalPresupuesto(secciones: PresupuestoSeccion[]): number {
  return secciones.reduce((sum, seccion) => sum + calcularSubtotalSeccion(seccion), 0)
}

export function montoEtapa(total: number, etapa: EtapaPago): number {
  return (total * etapa.porcentaje) / 100
}

export function sumaPorcentajes(etapas: EtapaPago[]): number {
  return etapas.reduce((sum, e) => sum + e.porcentaje, 0)
}

export function actualizaPorCac(presupuesto: Pick<Presupuesto, 'moneda' | 'mesBaseCac'>): boolean {
  return presupuesto.moneda === 'ARS' && Boolean(presupuesto.mesBaseCac)
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
