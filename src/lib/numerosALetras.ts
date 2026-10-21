// Montos en letras para recibos ("PESOS UN MILLÓN DOSCIENTOS MIL CON 16/100").

const UNIDADES = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
]
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
  'ochocientos', 'novecientos',
]

/** `apocope`: "uno" pasa a "un" delante de "mil" o "millones" (veintiún mil, treinta y un millones). */
function hasta99(n: number, apocope: boolean): string {
  if (n < 30) {
    if (apocope && n === 1) return 'un'
    if (apocope && n === 21) return 'veintiún'
    return UNIDADES[n]
  }
  const d = Math.floor(n / 10)
  const u = n % 10
  if (u === 0) return DECENAS[d]
  return `${DECENAS[d]} y ${apocope && u === 1 ? 'un' : UNIDADES[u]}`
}

function hasta999(n: number, apocope: boolean): string {
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100)
  const r = n % 100
  return [c ? CENTENAS[c] : '', r ? hasta99(r, apocope) : ''].filter(Boolean).join(' ')
}

function hasta999999(n: number, apocope: boolean): string {
  const miles = Math.floor(n / 1000)
  const r = n % 1000
  const partes: string[] = []
  if (miles === 1) partes.push('mil')
  else if (miles > 1) partes.push(`${hasta999(miles, true)} mil`)
  if (r) partes.push(hasta999(r, apocope))
  return partes.join(' ')
}

/** Entero no negativo en letras (hasta 999.999.999.999). */
export function enteroALetras(n: number): string {
  if (n === 0) return 'cero'
  const millones = Math.floor(n / 1_000_000)
  const r = n % 1_000_000
  const partes: string[] = []
  if (millones === 1) partes.push('un millón')
  else if (millones > 1) partes.push(`${hasta999999(millones, true)} millones`)
  if (r) partes.push(hasta999999(r, false))
  return partes.join(' ')
}

const NOMBRE_MONEDA = { ARS: 'pesos', USD: 'dólares estadounidenses' } as const

/** `1210000.5, 'ARS'` → `PESOS UN MILLÓN DOSCIENTOS DIEZ MIL CON 50/100` */
export function montoEnLetras(monto: number, moneda: keyof typeof NOMBRE_MONEDA): string {
  const centavosTotales = Math.round(Math.abs(monto) * 100)
  const entero = Math.floor(centavosTotales / 100)
  const centavos = String(centavosTotales % 100).padStart(2, '0')
  return `${NOMBRE_MONEDA[moneda]} ${enteroALetras(entero)} con ${centavos}/100`.toUpperCase()
}
