import { useState } from 'react'
import { Plus } from 'lucide-react'
import { usePagos } from '@/hooks/usePagos'
import { useIndicesCac } from '@/hooks/useIndicesCac'
import { calcularActualizacion } from '@/lib/indicesCac'
import { calcularResumenEtapas, etapaDePago, ultimoMesCac } from '@/lib/cobros'
import { actualizaPorCac, type Presupuesto } from '@/types/presupuesto'
import { metodoLabel } from '@/types/pago'
import { formatCurrency, formatDate, formatMes, formatPorcentaje } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PagoFormDialog } from '@/components/cobros/PagoFormDialog'
import { DetalleMontoPago } from '@/components/cobros/DetalleMontoPago'
import { ReciboButton } from '@/components/cobros/ReciboButton'

/** Avance de cobro de cada etapa del plan de pagos, con lo pendiente actualizado por CAC. */
export function CobranzaPorEtapa({ presupuesto }: { presupuesto: Presupuesto }) {
  const { data: pagos } = usePagos()
  const { data: indices } = useIndicesCac()
  const [etapaDialog, setEtapaDialog] = useState<string | null>(null)

  const pagosPresupuesto = (pagos ?? []).filter((p) => p.presupuestoId === presupuesto.id)
  const aprobado = presupuesto.estado === 'aprobado'
  if (!aprobado && pagosPresupuesto.length === 0) return null

  const money = (value: number) => formatCurrency(value, presupuesto.moneda)
  const { etapas, sinEtapa } = calcularResumenEtapas(presupuesto, pagos ?? [])
  const mesUltimo = ultimoMesCac(indices ?? [])
  const actualizacion =
    actualizaPorCac(presupuesto) && mesUltimo
      ? calcularActualizacion(indices ?? [], presupuesto.mesBaseCac, mesUltimo)
      : null
  const conCac = actualizaPorCac(presupuesto)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cobranza</CardTitle>
        {conCac && (
          <p className="text-sm text-muted-foreground">
            {actualizacion
              ? `Pendiente actualizado al CAC de ${formatMes(mesUltimo)} (coeficiente ${actualizacion.coeficiente.toLocaleString('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} sobre ${formatMes(presupuesto.mesBaseCac)}).`
              : `Para ver lo pendiente actualizado, cargá los índices CAC desde ${formatMes(presupuesto.mesBaseCac)}.`}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Monto base</TableHead>
              <TableHead className="text-right">Cancelado</TableHead>
              <TableHead className="text-right">Pendiente</TableHead>
              {conCac && <TableHead className="text-right">Pendiente actualizado</TableHead>}
              <TableHead className="text-right">Cobrar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {etapas.map(({ etapa, monto, cancelado, pendiente }) => (
              <TableRow key={etapa.id}>
                <TableCell>
                  {etapa.descripcion || '—'}
                  <span className="ml-2 text-xs text-muted-foreground">{formatPorcentaje(etapa.porcentaje)}</span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(monto)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(cancelado)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{money(pendiente)}</TableCell>
                {conCac && (
                  <TableCell className="text-right whitespace-nowrap">
                    {actualizacion ? money(pendiente * actualizacion.coeficiente) : '—'}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {pendiente <= 0.005 ? (
                    <span className="text-xs text-muted-foreground">Cobrada</span>
                  ) : (
                    <Button variant="outline" size="sm" disabled={!aprobado} onClick={() => setEtapaDialog(etapa.id)}>
                      <Plus className="h-4 w-4" />
                      Pago
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(sinEtapa.cancelado > 0 || etapas.length === 0) && (
              <TableRow>
                <TableCell className="text-muted-foreground">A cuenta (sin etapa)</TableCell>
                <TableCell />
                <TableCell className="text-right whitespace-nowrap">{money(sinEtapa.cancelado)}</TableCell>
                <TableCell />
                {conCac && <TableCell />}
                <TableCell className="text-right">
                  {etapas.length === 0 && (
                    <Button variant="outline" size="sm" disabled={!aprobado} onClick={() => setEtapaDialog('')}>
                      <Plus className="h-4 w-4" />
                      Pago
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {pagosPresupuesto.length > 0 && (
          <div className="px-6 pb-6">
            <p className="mb-2 text-sm font-medium">Pagos registrados</p>
            <div className="flex flex-col divide-y divide-border rounded-md border border-border">
              {pagosPresupuesto.map((pago) => (
                <div key={pago.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                  <div className="flex flex-col">
                    <span>{etapaDePago(pago, presupuesto)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(pago.fecha)} · {metodoLabel(pago.metodo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DetalleMontoPago pago={pago} />
                    <ReciboButton pago={pago} presupuesto={presupuesto} pagos={pagos ?? []} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <PagoFormDialog
        presupuesto={presupuesto}
        pagos={pagos ?? []}
        open={etapaDialog !== null}
        onOpenChange={(open) => !open && setEtapaDialog(null)}
        etapaIdInicial={etapaDialog || undefined}
      />
    </Card>
  )
}
