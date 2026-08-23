import type { jsPDF } from 'jspdf'
import type { Presupuesto } from '@/types/presupuesto'
import { calcularSubtotalSeccion, calcularTotalPresupuesto, estadoLabel } from '@/types/presupuesto'
import { formatCurrency, formatDate } from '@/lib/utils'

type JsPdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

export async function generarPresupuestoPdf(presupuesto: Presupuesto): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF() as JsPdfWithAutoTable
  const marginX = 14
  let cursorY = 18

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Ingroma', marginX, cursorY)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Presupuesto N° ${presupuesto.numero}`, 210 - marginX, cursorY, { align: 'right' })

  cursorY += 10
  doc.setFontSize(10)
  doc.text(`Cliente: ${presupuesto.clienteNombre || '—'}`, marginX, cursorY)
  doc.text(`Estado: ${estadoLabel(presupuesto.estado)}`, 210 - marginX, cursorY, { align: 'right' })

  cursorY += 6
  doc.text(`Fecha: ${formatDate(presupuesto.fecha)}`, marginX, cursorY)
  if (presupuesto.validoHasta) {
    doc.text(`Válido hasta: ${formatDate(presupuesto.validoHasta)}`, 210 - marginX, cursorY, { align: 'right' })
  }

  cursorY += 8

  for (const seccion of presupuesto.secciones) {
    if (seccion.titulo) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(seccion.titulo, marginX, cursorY)
      doc.setFont('helvetica', 'normal')
      cursorY += 4
    }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['Descripción', 'Cantidad', 'Precio unit.', 'Subtotal']],
      body: seccion.items.map((item) => [
        item.descripcion || '—',
        String(item.cantidad),
        formatCurrency(item.precioUnitario),
        formatCurrency(item.cantidad * item.precioUnitario),
      ]),
      foot: [['', '', 'Subtotal', formatCurrency(calcularSubtotalSeccion(seccion))]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [8, 6, 13] },
      footStyles: { fillColor: [244, 244, 245], textColor: [8, 6, 13] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    })

    cursorY = doc.lastAutoTable.finalY + 8
  }

  const total = calcularTotalPresupuesto(presupuesto.secciones)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total: ${formatCurrency(total)}`, 210 - marginX, cursorY, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  cursorY += 10

  if (presupuesto.notas) {
    doc.setFontSize(10)
    doc.text('Notas:', marginX, cursorY)
    cursorY += 5
    const lines = doc.splitTextToSize(presupuesto.notas, 210 - marginX * 2)
    doc.text(lines, marginX, cursorY)
  }

  doc.save(`presupuesto-${presupuesto.numero}.pdf`)
}
