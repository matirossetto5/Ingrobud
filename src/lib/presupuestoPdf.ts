import type { jsPDF } from 'jspdf'
import type { PresupuestoVersion } from '@/types/presupuesto'
import { calcularSubtotalSeccion, calcularTotalPresupuesto, montoEtapa, revisionLabel } from '@/types/presupuesto'
import { textoActualizacion } from '@/lib/condiciones'
import { getCliente } from '@/lib/clientes'
import { EMPRESA } from '@/lib/empresa'
import { formatCurrency, formatDate, formatPorcentaje } from '@/lib/utils'
import logoUrl from '@/assets/brand/logo-lockup-pdf.png'

type JsPdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 14
const INK: [number, number, number] = [8, 6, 13]
const MUTED: [number, number, number] = [113, 113, 122]
const LOGO_ASPECT = 900 / 204

/** Alinea a la derecha encabezado y celdas de las columnas numéricas. */
function alinearDerecha(columnas: number[]) {
  return (data: { column: { index: number }; cell: { styles: { halign?: string } } }) => {
    if (columnas.includes(data.column.index)) data.cell.styles.halign = 'right'
  }
}

async function cargarLogo(): Promise<string | null> {
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

export async function generarPresupuestoPdf(presupuesto: PresupuestoVersion): Promise<void> {
  const [{ jsPDF }, { default: autoTable }, logo, cliente] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    cargarLogo(),
    // Sin conexión o sin cliente, el PDF sale igual con el nombre guardado en el presupuesto.
    presupuesto.clienteId ? getCliente(presupuesto.clienteId).catch(() => null) : Promise.resolve(null),
  ])
  const doc = new jsPDF() as JsPdfWithAutoTable
  const money = (value: number) => formatCurrency(value, presupuesto.moneda)
  const right = PAGE_WIDTH - MARGIN_X
  let cursorY = 14

  // Encabezado: logo a la izquierda, datos de contacto a la derecha.
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
  contacto.forEach((linea, i) => doc.text(linea, right, cursorY + 2.5 + i * 3.8, { align: 'right' }))

  cursorY += logoHeight + 6
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.6)
  doc.line(MARGIN_X, cursorY, right, cursorY)

  // Título y fechas.
  cursorY += 9
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(`PRESUPUESTO N° ${presupuesto.numero}`, MARGIN_X, cursorY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(revisionLabel(presupuesto.revision), right, cursorY, { align: 'right' })
  cursorY += 6
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const fechas = [`Fecha: ${formatDate(presupuesto.fecha) || '—'}`]
  if (presupuesto.validoHasta) fechas.push(`Válido hasta: ${formatDate(presupuesto.validoHasta)}`)
  doc.text(fechas.join('     '), MARGIN_X, cursorY)

  // Datos del cliente.
  cursorY += 8
  const clienteLineas = [
    cliente?.empresa,
    cliente?.direccion,
    [cliente?.telefono, cliente?.email].filter(Boolean).join(' · '),
  ].filter((l): l is string => Boolean(l))
  const boxHeight = 13 + clienteLineas.length * 4.5
  doc.setFillColor(244, 244, 245)
  doc.roundedRect(MARGIN_X, cursorY, PAGE_WIDTH - MARGIN_X * 2, boxHeight, 1.5, 1.5, 'F')
  doc.setFontSize(8)
  doc.text('CLIENTE', MARGIN_X + 4, cursorY + 5)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(cliente?.nombre || presupuesto.clienteNombre || '—', MARGIN_X + 4, cursorY + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  clienteLineas.forEach((linea, i) => doc.text(linea, MARGIN_X + 4, cursorY + 14.5 + i * 4.5))
  cursorY += boxHeight + 8

  for (const seccion of presupuesto.secciones) {
    if (seccion.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(seccion.titulo, MARGIN_X, cursorY)
      doc.setFont('helvetica', 'normal')
      cursorY += 4
    }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X, bottom: 22 },
      head: [['Descripción', 'Cantidad', 'Precio unit.', 'Subtotal']],
      body: seccion.items.map((item) => [
        item.descripcion || '—',
        String(item.cantidad),
        money(item.precioUnitario),
        money(item.cantidad * item.precioUnitario),
      ]),
      foot: [['', '', 'Subtotal', money(calcularSubtotalSeccion(seccion))]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: INK },
      footStyles: { fillColor: [244, 244, 245], textColor: INK },
      didParseCell: alinearDerecha([1, 2, 3]),
    })

    cursorY = doc.lastAutoTable.finalY + 8
  }

  // Total destacado.
  if (cursorY > PAGE_HEIGHT - 40) {
    doc.addPage()
    cursorY = 20
  }
  const total = calcularTotalPresupuesto(presupuesto.secciones)
  doc.setFillColor(...INK)
  doc.rect(right - 80, cursorY - 6, 80, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL', right - 76, cursorY + 0.5)
  doc.text(money(total), right - 4, cursorY + 0.5, { align: 'right' })
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  cursorY += 14

  // Forma de pago y cláusula de moneda/actualización.
  doc.setFontSize(9)
  const condiciones = doc.splitTextToSize(textoActualizacion(presupuesto), PAGE_WIDTH - MARGIN_X * 2)
  if (cursorY + 20 + presupuesto.etapasPago.length * 7 > PAGE_HEIGHT - 22) {
    doc.addPage()
    cursorY = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Forma de pago', MARGIN_X, cursorY)
  doc.setFont('helvetica', 'normal')
  cursorY += 4
  if (presupuesto.etapasPago.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X, bottom: 22 },
      head: [['Etapa', '%', 'Monto']],
      body: presupuesto.etapasPago.map((etapa) => [
        etapa.descripcion || '—',
        formatPorcentaje(etapa.porcentaje),
        money(montoEtapa(total, etapa)),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: INK },
      columnStyles: { 1: { cellWidth: 25 }, 2: { cellWidth: 45 } },
      didParseCell: alinearDerecha([1, 2]),
    })
    cursorY = doc.lastAutoTable.finalY + 6
  } else {
    cursorY += 2
  }
  if (cursorY + condiciones.length * 4.5 > PAGE_HEIGHT - 22) {
    doc.addPage()
    cursorY = 20
  }
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(condiciones, MARGIN_X, cursorY)
  doc.setTextColor(...INK)
  cursorY += condiciones.length * 4.5 + 6

  if (presupuesto.notas) {
    const lines = doc.splitTextToSize(presupuesto.notas, PAGE_WIDTH - MARGIN_X * 2)
    if (cursorY + 6 + lines.length * 4.5 > PAGE_HEIGHT - 22) {
      doc.addPage()
      cursorY = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Notas', MARGIN_X, cursorY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    cursorY += 5
    doc.text(lines, MARGIN_X, cursorY)
  }

  // Pie en todas las páginas: firma profesional y numeración.
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.3)
    doc.line(MARGIN_X, PAGE_HEIGHT - 16, right, PAGE_HEIGHT - 16)
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${EMPRESA.responsable} — ${EMPRESA.titulo} · ${EMPRESA.nombre}`, MARGIN_X, PAGE_HEIGHT - 11)
    doc.text(`Página ${i} de ${paginas}`, right, PAGE_HEIGHT - 11, { align: 'right' })
  }

  doc.save(`presupuesto-${presupuesto.numero}-rev${presupuesto.revision}.pdf`)
}
