import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePagos, useDeletePago } from '@/hooks/usePagos'
import { useIndicesCac } from '@/hooks/useIndicesCac'
import {
  calcularResumenCobros,
  esCobrable,
  etapaDePago,
  saldoActualizado,
  saldoPendiente,
  sumarPorMoneda,
  type ResumenCobro,
} from '@/lib/cobros'
import { metodoLabel } from '@/types/pago'
import { estadoLabel } from '@/types/presupuesto'
import { formatCurrency, formatDate, formatMes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { MontosPorMoneda } from '@/components/MontosPorMoneda'
import { PagoFormDialog } from '@/components/cobros/PagoFormDialog'
import { DetalleMontoPago } from '@/components/cobros/DetalleMontoPago'

export function CobrosPage() {
  const { data: presupuestos, isLoading: loadingPresupuestos } = usePresupuestos()
  const { data: pagos, isLoading: loadingPagos } = usePagos()
  const { data: indices } = useIndicesCac()
  const deletePago = useDeletePago()

  const [dialogPresupuestoId, setDialogPresupuestoId] = useState<string | null>(null)

  const isLoading = loadingPresupuestos || loadingPagos
  // Se listan los aprobados y, para no perder historial, los que ya tienen pagos aunque hoy no estén
  // aprobados (p. ej. un presupuesto cobrado parcialmente que pasó a una nueva revisión en borrador).
  const resumen = calcularResumenCobros(presupuestos ?? [], pagos ?? [])
    .filter((r) => (esCobrable(r) && r.total > 0) || r.cobrado > 0)
    .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))

  const totalCobrado = sumarPorMoneda(pagos ?? [], (p) => p.moneda, (p) => p.monto)
  const totalPendiente = sumarPorMoneda(resumen, (r) => r.moneda, (r) => saldoActualizado(r, indices ?? []).monto)
  const presupuestoDialog = presupuestos?.find((p) => p.id === dialogPresupuestoId) ?? null

  async function handleDeletePago(pagoId: string) {
    if (!window.confirm('¿Eliminar este pago? Esta acción no se puede deshacer.')) return
    await deletePago.mutateAsync(pagoId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cobros</h1>
        <p className="text-muted-foreground">Registro de pagos y saldos pendientes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={totalCobrado} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={totalPendiente} />
            <p className="text-xs text-muted-foreground">Pesos actualizados al último índice CAC cargado</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando…</CardContent>
        </Card>
      ) : resumen.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No hay presupuestos aprobados para cobrar todavía.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="text-right">Saldo base</TableHead>
                <TableHead className="text-right">Saldo actualizado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumen.map((r) => {
                const actualizado = saldoActualizado(r, indices ?? [])
                return (
                  <TableRow key={r.presupuesto.id}>
                    <TableCell className="font-medium">
                      <Link to={`/presupuestos/${r.presupuesto.id}`} className="hover:underline">
                        {r.presupuesto.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.presupuesto.clienteNombre || '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.total, r.moneda)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatCurrency(r.cobradoNominal, r.moneda)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {esCobrable(r) ? formatCurrency(saldoPendiente(r), r.moneda) : '—'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {!esCobrable(r) ? (
                        '—'
                      ) : actualizado.actualizado ? (
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(actualizado.monto, r.moneda)}</span>
                          <span className="text-xs text-muted-foreground">CAC {formatMes(actualizado.mes)}</span>
                        </div>
                      ) : r.moneda === 'USD' ? (
                        <span className="text-muted-foreground">No aplica</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Faltan índices</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <EstadoCobroBadge resumen={r} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saldoPendiente(r) <= 0.005}
                        onClick={() => setDialogPresupuestoId(r.presupuesto.id)}
                      >
                        <Plus className="h-4 w-4" />
                        Registrar pago
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>
        {!pagos || pagos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Todavía no se registró ningún pago.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Presupuesto / etapa</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pago) => {
                  const presupuesto = presupuestos?.find((p) => p.id === pago.presupuestoId)
                  return (
                    <TableRow key={pago.id}>
                      <TableCell className="text-muted-foreground">{formatDate(pago.fecha)}</TableCell>
                      <TableCell>{pago.clienteNombre || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        N° {presupuesto?.numero ?? '—'}
                        {presupuesto && <span className="block text-xs">{etapaDePago(pago, presupuesto)}</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{metodoLabel(pago.metodo)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <DetalleMontoPago pago={pago} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar pago"
                          onClick={() => handleDeletePago(pago.id)}
                          disabled={deletePago.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <PagoFormDialog
        presupuesto={presupuestoDialog}
        pagos={pagos ?? []}
        open={dialogPresupuestoId !== null}
        onOpenChange={(open) => setDialogPresupuestoId(open ? dialogPresupuestoId : null)}
      />
    </div>
  )
}

function EstadoCobroBadge({ resumen }: { resumen: ResumenCobro }) {
  if (!esCobrable(resumen)) return <Badge variant="default">{estadoLabel(resumen.presupuesto.estado)}</Badge>
  if (resumen.saldo <= 0.005) return <Badge variant="success">Pagado</Badge>
  if (resumen.cobrado > 0) return <Badge variant="primary">Parcial</Badge>
  return <Badge variant="default">Pendiente</Badge>
}
