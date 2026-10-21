import { Link } from 'react-router-dom'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePagos } from '@/hooks/usePagos'
import { useIndicesCac } from '@/hooks/useIndicesCac'
import { calcularResumenCobros, saldoActualizado, saldoPendiente, sumarPorMoneda } from '@/lib/cobros'
import { MontosPorMoneda } from '@/components/MontosPorMoneda'
import { formatCurrency, formatDate } from '@/lib/utils'
import { estadoBadgeVariant, estadoLabel } from '@/types/presupuesto'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function isMismoMes(fecha: string, referencia: Date): boolean {
  if (!fecha) return false
  const [year, month] = fecha.split('-').map(Number)
  return year === referencia.getFullYear() && month === referencia.getMonth() + 1
}

export function DashboardPage() {
  const { data: presupuestos } = usePresupuestos()
  const { data: pagos } = usePagos()
  const { data: indices } = useIndicesCac()

  const ahora = new Date()
  const cobradoEsteMes = sumarPorMoneda(
    (pagos ?? []).filter((pago) => isMismoMes(pago.fecha, ahora)),
    (pago) => pago.moneda,
    (pago) => pago.monto,
  )

  const resumen = calcularResumenCobros(presupuestos ?? [], pagos ?? [])
  const pendienteDeCobro = sumarPorMoneda(resumen, (r) => r.moneda, (r) => saldoActualizado(r, indices ?? []).monto)
  const presupuestosEnviados = (presupuestos ?? []).filter((p) => p.estado === 'enviado').length

  const pendientes = resumen
    .filter((r) => saldoPendiente(r) > 0)
    .sort((a, b) => saldoPendiente(b) - saldoPendiente(a))
    .slice(0, 5)

  const ultimosPagos = (pagos ?? []).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de caja, presupuestos y cobros pendientes.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobrado este mes</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={cobradoEsteMes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={pendienteDeCobro} />
            <p className="text-xs text-muted-foreground">Pesos actualizados al último índice CAC cargado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuestos enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{presupuestosEnviados}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldos pendientes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay saldos pendientes.</p>
            ) : (
              pendientes.map((r) => (
                <Link
                  key={r.presupuesto.id}
                  to={`/presupuestos/${r.presupuesto.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">N° {r.presupuesto.numero}</span>
                    <span className="text-muted-foreground">{r.presupuesto.clienteNombre}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(saldoActualizado(r, indices ?? []).monto, r.moneda)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos pagos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ultimosPagos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no se registró ningún pago.</p>
            ) : (
              ultimosPagos.map((pago) => (
                <div key={pago.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{pago.clienteNombre || '—'}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(pago.fecha)}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(pago.monto, pago.moneda)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos presupuestos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!presupuestos || presupuestos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no creaste ningún presupuesto.</p>
          ) : (
            presupuestos.slice(0, 5).map((presupuesto) => (
              <Link
                key={presupuesto.id}
                to={`/presupuestos/${presupuesto.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">N° {presupuesto.numero}</span>
                  <span className="text-muted-foreground">{presupuesto.clienteNombre}</span>
                </div>
                <Badge variant={estadoBadgeVariant(presupuesto.estado)}>{estadoLabel(presupuesto.estado)}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
