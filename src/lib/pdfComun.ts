import type { jsPDF } from 'jspdf'
import { EMPRESA } from '@/lib/empresa'
import logoUrl from '@/assets/brand/logo-lockup-pdf.png'

// Piezas compartidas por los PDF que se entregan al cliente (presupuestos y recibos).

export type JsPdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

export const PAGE_WIDTH = 210
export const PAGE_HEIGHT = 297
export const MARGIN_X = 14
export const RIGHT = PAGE_WIDTH - MARGIN_X
export const INK: [number, number, number] = [8, 6, 13]
export const MUTED: [number, number, number] = [113, 113, 122]
export const SOFT: [number, number, number] = [244, 244, 245]
const LOGO_ASPECT = 900 / 204

/** Alinea a la derecha encabezado y celdas de las columnas numéricas. */
export function alinearDerecha(columnas: number[]) {
  return (data: { column: { index: number }; cell: { styles: { halign?: string } } }) => {
    if (columnas.includes(data.column.index)) data.cell.styles.halign = 'right'
  }
}

export async function cargarLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch(logoUrl)).blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Logo a la izquierda, datos de contacto a la derecha y una línea. Devuelve la Y siguiente. */
export function dibujarEncabezado(doc: jsPDF, logo: string | null): number {
  let cursorY = 14
  const logoHeight = 12
  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN_X, cursorY, logoHeight * LOGO_ASPECT, logoHeight)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(EMPRESA.nombre.toUpperCase(), MARGIN_X, cursorY + 9)
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  const contacto = [EMPRESA.rubro, EMPRESA.telefono, EMPRESA.email, `${EMPRESA.instagram} · ${EMPRESA.ubicacion}`]
  contacto.forEach((linea, i) => doc.text(linea, RIGHT, cursorY + 2.5 + i * 3.8, { align: 'right' }))

  cursorY += logoHeight + 6
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.6)
  doc.line(MARGIN_X, cursorY, RIGHT, cursorY)
  doc.setTextColor(...INK)
  return cursorY
}

/** Pie en todas las páginas: firma profesional y numeración. */
export function dibujarPie(doc: jsPDF): void {
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.3)
    doc.line(MARGIN_X, PAGE_HEIGHT - 16, RIGHT, PAGE_HEIGHT - 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${EMPRESA.responsable} — ${EMPRESA.titulo} · ${EMPRESA.nombre}`, MARGIN_X, PAGE_HEIGHT - 11)
    doc.text(`Página ${i} de ${paginas}`, RIGHT, PAGE_HEIGHT - 11, { align: 'right' })
  }
}
