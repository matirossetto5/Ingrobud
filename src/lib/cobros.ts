import {
  actualizaPorCac,
  calcularTotalPresupuesto,
  montoEtapa,
  type EtapaPago,
  type Moneda,
  type Presupuesto,
} from '@/types/presupuesto'
import type { Pago } from '@/types/pago'
import type { IndiceCac } from '@/types/indiceCac'
import { calcularActualizacion } from '@/lib/indicesCac'

// Todos los montos "base" están a valores del mes base del presupuesto. Un pago cancela su
// montoBase (lo cobrado dividido el coeficiente CAC), así lo ya cobrado queda congelado y solo
// lo pendiente se sigue actualizando.

export interface ResumenCobro {
  presupuesto: Presupuesto
  moneda: Moneda
  /** Total del presupuesto a valores base. */
  total: number
  /** Parte del total ya cancelada, a valores base. */
  cobrado: number
  /** Lo efectivamente cobrado (nominal, con actualizaciones incluidas). */
  cobradoNominal: number
  /** Pendiente a valores base. */
  saldo: number
}

export function calcularResumenCobros(presupuestos: Presupuesto[], pagos: Pago[]): ResumenCobro[] {
  return presupuestos.map((presupuesto) => {
    const total = calcularTotalPresupuesto(presupuesto.secciones)
    const delPresupuesto = pagos.filter((pago) => pago.presupuestoId === presupuesto.id)
    const cobrado = delPresupuesto.reduce((sum, pago) => sum + pago.montoBase, 0)
    const cobradoNominal = delPresupuesto.reduce((sum, pago) => sum + pago.monto, 0)
    return { presupuesto, moneda: presupuesto.moneda, total, cobrado, cobradoNominal, saldo: total - cobrado }
  })
}

/** Solo un presupuesto aprobado genera deuda: borradores, enviados y rechazados no se cobran. */
export function esCobrable(resumen: ResumenCobro): boolean {
  return resumen.presupuesto.estado === 'aprobado'
}

export function saldoPendiente(resumen: ResumenCobro): number {
  return esCobrable(resumen) ? Math.max(resumen.saldo, 0) : 0
}

/** Último mes con índice CAC cargado (`YYYY-MM`), o '' si no hay ninguno. */
export function ultimoMesCac(indices: IndiceCac[]): string {
  return indices.reduce((max, i) => (i.mes > max ? i.mes : max), '')
}

/**
 * Saldo pendiente llevado al último índice CAC disponible. En dólares, sin mes base o si falta
 * algún índice devuelve el saldo base (y `actualizado: false`).
 */
export function saldoActualizado(
  resumen: ResumenCobro,
  indices: IndiceCac[],
): { monto: number; actualizado: boolean; mes: string } {
  const base = saldoPendiente(resumen)
  const mes = ultimoMesCac(indices)
  if (!actualizaPorCac(resumen.presupuesto) || !mes) return { monto: base, actualizado: false, mes: '' }
  const act = calcularActualizacion(indices, resumen.presupuesto.mesBaseCac, mes)
  if (!act) return { monto: base, actualizado: false, mes: '' }
  return { monto: base * act.coeficiente, actualizado: true, mes }
}

export interface ResumenEtapa {
  etapa: EtapaPago
  /** Monto de la etapa a valores base. */
  monto: number
  cancelado: number
  cobradoNominal: number
  pendiente: number
}

export function calcularResumenEtapas(
  presupuesto: Presupuesto,
  pagos: Pago[],
): { etapas: ResumenEtapa[]; sinEtapa: { cancelado: number; cobradoNominal: number } } {
  const total = calcularTotalPresupuesto(presupuesto.secciones)
  const delPresupuesto = pagos.filter((p) => p.presupuestoId === presupuesto.id)
  const idsEtapas = new Set(presupuesto.etapasPago.map((e) => e.id))
  const etapas = presupuesto.etapasPago.map((etapa) => {
    const deEtapa = delPresupuesto.filter((p) => p.etapaId === etapa.id)
    const monto = montoEtapa(total, etapa)
    const cancelado = deEtapa.reduce((sum, p) => sum + p.montoBase, 0)
    return {
      etapa,
      monto,
      cancelado,
      cobradoNominal: deEtapa.reduce((sum, p) => sum + p.monto, 0),
      pendiente: Math.max(monto - cancelado, 0),
    }
  })
  // Pagos sin etapa o de una etapa que ya no existe (p. ej. se quitó en una revisión).
  const sueltos = delPresupuesto.filter((p) => !idsEtapas.has(p.etapaId))
  return {
    etapas,
    sinEtapa: {
      cancelado: sueltos.reduce((sum, p) => sum + p.montoBase, 0),
      cobradoNominal: sueltos.reduce((sum, p) => sum + p.monto, 0),
    },
  }
}

/** Nombre de la etapa que canceló un pago, para listados. */
export function etapaDePago(pago: Pago, presupuesto: Presupuesto): string {
  if (!pago.etapaId) return 'A cuenta'
  return presupuesto.etapasPago.find((e) => e.id === pago.etapaId)?.descripcion || 'Etapa eliminada'
}

export type MontosPorMoneda = Record<Moneda, number>

export function sumarPorMoneda<T>(items: T[], moneda: (item: T) => Moneda, monto: (item: T) => number): MontosPorMoneda {
  return items.reduce<MontosPorMoneda>(
    (acc, item) => {
      acc[moneda(item)] += monto(item)
      return acc
    },
    { ARS: 0, USD: 0 },
  )
}
