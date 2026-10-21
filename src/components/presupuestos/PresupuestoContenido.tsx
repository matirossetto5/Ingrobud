import type { PresupuestoVersion } from '@/types/presupuesto'
import { calcularSubtotalSeccion, calcularTotalPresupuesto } from '@/types/presupuesto'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

/** Fechas, secciones, ítems y notas de una versión del presupuesto (vigente o archivada). */
export function PresupuestoContenido({ presupuesto }: { presupuesto: PresupuestoVersion }) {
  const total = calcularTotalPresupuesto(presupuesto.secciones)

  return (
    <>
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fecha</p>
            <p>{formatDate(presupuesto.fecha) || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Válido hasta</p>
            <p>{formatDate(presupuesto.validoHasta) || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="font-semibold">{formatCurrency(total)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {presupuesto.secciones.map((seccion) => (
          <Card key={seccion.id}>
            <CardHeader>
              <CardTitle className="text-base">{seccion.titulo || 'Ítems'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seccion.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.descripcion || '—'}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.cantidad * item.precioUnitario)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border px-3 py-3 text-right text-sm text-muted-foreground">
                Subtotal: <span className="font-medium text-foreground">{formatCurrency(calcularSubtotalSeccion(seccion))}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {presupuesto.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{presupuesto.notas}</CardContent>
        </Card>
      )}
    </>
  )
}
