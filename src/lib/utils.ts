import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Moneda } from '@/types/presupuesto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatters: Record<Moneda, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
  USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }),
}

export function formatCurrency(value: number, moneda: Moneda = 'ARS'): string {
  return currencyFormatters[moneda].format(value)
}

const mesFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

/** `2026-09` → `septiembre de 2026` */
export function formatMes(value: string): string {
  if (!value) return ''
  const [year, month] = value.split('-').map(Number)
  return mesFormatter.format(new Date(year, month - 1, 1))
}

export function formatPorcentaje(value: number): string {
  return `${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}

export function formatDate(value: string): string {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
