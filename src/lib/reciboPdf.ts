import { calcularTotalPresupuesto, revisionLabel, type Presupuesto } from '@/types/presupuesto'
import { metodoLabel, type Pago } from '@/types/pago'
import { getCliente } from '@/lib/clientes'
import { asignarNumeroRecibo } from '@/lib/pagos'
import { getIndicesCac } from '@/lib/indicesCac'
import { etapaDePago } from '@/lib/cobros'
import { montoEnLetras } from '@/lib/numerosALetras'
import { EMPRESA } from '@/lib/empresa'
import { formatCurrency, formatDate, formatMes, formatPorcentaje } from '@/lib/utils'
import {
  INK,
  MARGIN_X,
  MUTED,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  RIGHT,
  SOFT,
  alinearDerecha,
  cargarLogo,
  dibujarEncabezado,
  dibujarPie,
  type JsPdfWithAutoTable,
} from '@/lib/pdfComun'

export function formatNumeroRecibo(numero: number): string {
  return String(numero).padStart(5, '0')
}

/** Pagos del mismo presupuesto anteriores o iguales a este (por fecha y, a igual fecha, por alta). */
function pagosHasta(pago: Pago, pagos: Pago[]): Pago[] {
  return pagos.filter(
    (p) =>
      p.presupuestoId === pago.presupuestoId &&
      (p.fecha < pago.fecha || (p.fecha === pago.fecha && p.createdAt <= pago.createdAt) || p.id === pago.id),
  )
}

/**
 * Genera y descarga el recibo de un pago. Si el pago todavía no tenía número de recibo (pagos
 * anteriores a esta función), se lo asigna. Devuelve el número usado.
 */
export async function generarReciboPdf({
  pago,
  presupuesto,
  pagos,
}: {
  pago: Pago
  presupuesto: Presupuesto | undefined
  pagos: Pago[]
}): Promise<number> {
  const numero = pago.numeroRecibo || (await asignarNumeroRecibo(pago.id))
  // Pagos viejos no guardaban los valores del índice: se buscan en la tabla.
  const necesitaIndices = Boolean(pago.mesIndice) && !pago.indiceBase
  const [{ jsPDF }, { default: autoTable }, logo, cliente, indices] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    cargarLogo(),
    pago.clienteId ? getCliente(pago.clienteId).catch(() => null) : Promise.resolve(null),
    necesitaIndices ? getIndicesCac().catch(() => []) : Promise.resolve([]),
  ])
  const doc = new jsPDF() as JsPdfWithAutoTable
  const money = (value: number) => formatCurrency(value, pago.moneda)
  const ancho = PAGE_WIDTH - MARGIN_X * 2

  let cursorY = dibujarEncabezado(doc, logo)

  // Título, número y fecha.
  cursorY += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('RECIBO DE PAGO', MARGIN_X, cursorY)
  doc.setFontSize(12)
  doc.text(`N° ${formatNumeroRecibo(numero)}`, RIGHT, cursorY, { align: 'right' })
  cursorY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`${EMPRESA.ubicacion.split(',')[0]}, ${formatDate(pago.fecha)}`, RIGHT, cursorY, { align: 'right' })
  doc.setTextColor(...INK)

  // Recibí de…
  cursorY += 8
  const clienteLineas = [cliente?.empresa, cliente?.direccion].filter((l): l is string => Boolean(l))
  const boxHeight = 13 + clienteLineas.length * 4.5
  doc.setFillColor(...SOFT)
  doc.roundedRect(MARGIN_X, cursorY, ancho, boxHeight, 1.5, 1.5, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('RECIBÍ DE', MARGIN_X + 4, cursorY + 5)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.text(cliente?.nombre || pago.clienteNombre || '—', MARGIN_X + 4, cursorY + 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  clienteLineas.forEach((linea, i) => doc.text(linea, MARGIN_X + 4, cursorY + 14.5 + i * 4.5))
  cursorY += boxHeight + 8

  // La suma de…
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('LA SUMA DE', MARGIN_X, cursorY)
  cursorY += 5
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const letras = doc.splitTextToSize(montoEnLetras(pago.monto, pago.moneda), ancho - 70)
  doc.text(letras, MARGIN_X, cursorY)
  doc.setFillColor(...INK)
  doc.rect(RIGHT - 62, cursorY - 5, 62, 11, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.text(money(pago.monto), RIGHT - 4, cursorY + 2, { align: 'right' })
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  cursorY += Math.max(letras.length * 4.5, 8) + 6

  // En concepto de…
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('EN CONCEPTO DE', MARGIN_X, cursorY)
  cursorY += 5
  doc.setTextColor(...INK)
  doc.setFontSize(10)
  const etapa = presupuesto?.etapasPago.find((e) => e.id === pago.etapaId)
  const concepto = presupuesto
    ? `${etapa ? `Etapa "${etapa.descripcion || 'sin nombre'}" (${formatPorcentaje(etapa.porcentaje)})` : `Pago ${etapaDePago(pago, presupuesto).toLowerCase()}`} del presupuesto N° ${presupuesto.numero} — ${revisionLabel(presupuesto.revision)}.`
    : 'Pago a cuenta.'
  const conceptoLineas = doc.splitTextToSize(concepto, ancho)
  doc.text(conceptoLineas, MARGIN_X, cursorY)
  cursorY += conceptoLineas.length * 5
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`Forma de pago: ${metodoLabel(pago.metodo)}`, MARGIN_X, cursorY)
  cursorY += 5
  if (pago.notas) {
    const notas = doc.splitTextToSize(`Observaciones: ${pago.notas}`, ancho)
    doc.text(notas, MARGIN_X, cursorY)
    cursorY += notas.length * 4.5
  }
  doc.setTextColor(...INK)
  cursorY += 5

  // Detalle de la actualización por CAC.
  if (pago.mesIndice && presupuesto?.mesBaseCac) {
    const indiceBase =
      pago.indiceBase || indices.find((i) => i.mes === presupuesto.mesBaseCac)?.valor || 0
    const indiceAplicado = pago.indiceAplicado || indices.find((i) => i.mes === pago.mesIndice)?.valor || 0
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Actualización por índice CAC', MARGIN_X, cursorY)
    doc.setFont('helvetica', 'normal')
    cursorY += 3
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X, bottom: 22 },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.8 },
      body: [
        [`Monto a valores de ${formatMes(presupuesto.mesBaseCac)}`, money(pago.montoBase)],
        [`Índice CAC ${formatMes(presupuesto.mesBaseCac)} (base)`, indiceBase ? indiceBase.toLocaleString('es-AR') : '—'],
        [`Índice CAC ${formatMes(pago.mesIndice)} (aplicado)`, indiceAplicado ? indiceAplicado.toLocaleString('es-AR') : '—'],
        [
          'Coeficiente de actualización',
          pago.coeficiente.toLocaleString('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        ],
        ['Monto actualizado', money(pago.monto)],
      ],
      didParseCell: (data) => {
        if (data.column.index === 1) data.cell.styles.halign = 'right'
        if (data.row.index === 4) data.cell.styles.fontStyle = 'bold'
      },
      alternateRowStyles: { fillColor: SOFT },
    })
    cursorY = doc.lastAutoTable.finalY + 8
  }

  // Estado de cuenta del presupuesto después de este pago.
  if (presupuesto) {
    const total = calcularTotalPresupuesto(presupuesto.secciones)
    const previos = pagosHasta(pago, pagos)
    const cancelado = previos.reduce((sum, p) => sum + p.montoBase, 0)
    const conCac = presupuesto.moneda === 'ARS' && Boolean(presupuesto.mesBaseCac)
    const sufijo = conCac ? ` (a valores de ${formatMes(presupuesto.mesBaseCac)})` : ''
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Estado de cuenta', MARGIN_X, cursorY)
    doc.setFont('helvetica', 'normal')
    cursorY += 3
    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN_X, right: MARGIN_X, bottom: 22 },
      head: [['Concepto', 'Monto']],
      body: [
        [`Total del presupuesto${sufijo}`, money(total)],
        [`Cancelado a la fecha, incluido este pago${sufijo}`, money(cancelado)],
        [`Saldo pendiente${sufijo}`, money(Math.max(total - cancelado, 0))],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: INK },
      didParseCell: (data) => {
        alinearDerecha([1])(data)
        if (data.section === 'body' && data.row.index === 2) data.cell.styles.fontStyle = 'bold'
      },
    })
    cursorY = doc.lastAutoTable.finalY + 4
    if (conCac && total - cancelado > 0.005) {
      doc.setFontSize(8.5)
      doc.setTextColor(...MUTED)
      doc.text('El saldo pendiente se actualizará por índice CAC al momento de su pago.', MARGIN_X, cursorY + 2)
      doc.setTextColor(...INK)
      cursorY += 6
    }
  }

  // Firma.
  const firmaY = Math.max(cursorY + 28, PAGE_HEIGHT - 50)
  if (firmaY > PAGE_HEIGHT - 22) doc.addPage()
  const yFirma = firmaY > PAGE_HEIGHT - 22 ? 60 : firmaY
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.3)
  doc.line(RIGHT - 70, yFirma, RIGHT, yFirma)
  doc.setFontSize(9)
  doc.text(EMPRESA.responsable, RIGHT - 35, yFirma + 5, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(`${EMPRESA.titulo} · ${EMPRESA.nombre}`, RIGHT - 35, yFirma + 9, { align: 'center' })
  doc.setTextColor(...INK)

  dibujarPie(doc)
  doc.save(`recibo-${formatNumeroRecibo(numero)}.pdf`)
  return numero
}
