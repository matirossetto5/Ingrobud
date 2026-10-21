import type { PresupuestoVersion } from '@/types/presupuesto'
import { calcularSubtotalSeccion, calcularTotalPresupuesto, montoEtapa } from '@/types/presupuesto'
import { textoActualizacion } from '@/lib/condiciones'
import { formatCurrency, formatDate, formatPorcentaje } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

/** Fechas, secciones, ítems y notas de una versión del presupuesto (vigente o archivada). */
export function PresupuestoContenido({ presupuesto }: { presupuesto: PresupuestoVersion }) {
  const total = calcularTotalPresupuesto(presupuesto.secciones)
  const money = (value: number) => formatCurrency(value, presupuesto.moneda)

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
            <p className="font-semibold">{money(total)}</p>
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
                      <TableCell className="text-right">{money(item.precioUnitario)}</TableCell>
                      <TableCell className="text-right">{money(item.cantidad * item.precioUnitario)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border px-3 py-3 text-right text-sm text-muted-foreground">
                Subtotal: <span className="font-medium text-foreground">{money(calcularSubtotalSeccion(seccion))}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forma de pago</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-0">
          {presupuesto.etapasPago.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuesto.etapasPago.map((etapa) => (
                  <TableRow key={etapa.id}>
                    <TableCell>{etapa.descripcion || '—'}</TableCell>
                    <TableCell className="text-right">{formatPorcentaje(etapa.porcentaje)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{money(montoEtapa(total, etapa))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 text-sm text-muted-foreground">Sin plan de pagos definido.</p>
          )}
          <p className="px-6 pb-6 text-sm text-muted-foreground">{textoActualizacion(presupuesto)}</p>
        </CardContent>
      </Card>

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
