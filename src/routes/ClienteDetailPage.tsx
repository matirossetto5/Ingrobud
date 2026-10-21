import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Eye, Mail, MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { useCliente, useUpdateCliente } from '@/hooks/useClientes'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePagos } from '@/hooks/usePagos'
import { useIndicesCac } from '@/hooks/useIndicesCac'
import { calcularResumenCobros, esCobrable, saldoActualizado, saldoPendiente, sumarPorMoneda } from '@/lib/cobros'
import { estadoBadgeVariant, estadoLabel, revisionLabel } from '@/types/presupuesto'
import { metodoLabel } from '@/types/pago'
import type { ClienteInput } from '@/types/cliente'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { MontosPorMoneda } from '@/components/MontosPorMoneda'
import { DetalleMontoPago } from '@/components/cobros/DetalleMontoPago'
import { ReciboButton } from '@/components/cobros/ReciboButton'

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cliente, isLoading, isError } = useCliente(id)
  const { data: presupuestos, isLoading: loadingPresupuestos } = usePresupuestos()
  const { data: pagos, isLoading: loadingPagos } = usePagos()
  const { data: indices } = useIndicesCac()
  const updateCliente = useUpdateCliente()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando cliente…</p>
  }

  if (isError || !cliente) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">No se encontró el cliente.</p>
        <Button variant="outline" className="self-start" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const presupuestosCliente = (presupuestos ?? []).filter((p) => p.clienteId === cliente.id)
  const pagosCliente = (pagos ?? []).filter((p) => p.clienteId === cliente.id)
  const resumen = calcularResumenCobros(presupuestosCliente, pagosCliente)
  const aprobados = resumen.filter(esCobrable)
  const totalAprobado = sumarPorMoneda(aprobados, (r) => r.moneda, (r) => r.total)
  const totalCobrado = sumarPorMoneda(pagosCliente, (p) => p.moneda, (p) => p.monto)
  const totalPendiente = sumarPorMoneda(aprobados, (r) => r.moneda, (r) => saldoActualizado(r, indices ?? []).monto)
  const numeroPorPresupuesto = new Map(presupuestosCliente.map((p) => [p.id, p.numero]))

  async function handleSubmit(input: ClienteInput) {
    await updateCliente.mutateAsync({ id: cliente!.id, input })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cliente.nombre}</h1>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            {cliente.empresa && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {cliente.empresa}
              </span>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Mail className="h-3.5 w-3.5" />
                {cliente.email}
              </a>
            )}
            {cliente.telefono && (
              <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Phone className="h-3.5 w-3.5" />
                {cliente.telefono}
              </a>
            )}
            {cliente.direccion && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {cliente.direccion}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button asChild>
            <Link to={`/presupuestos/nuevo?cliente=${cliente.id}`}>
              <Plus className="h-4 w-4" />
              Nuevo presupuesto
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobado</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={totalAprobado} />
            <p className="text-xs text-muted-foreground">
              {aprobados.length} de {presupuestosCliente.length} presupuesto{presupuestosCliente.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={totalCobrado} />
            <p className="text-xs text-muted-foreground">
              {pagosCliente.length} pago{pagosCliente.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <MontosPorMoneda montos={totalPendiente} />
            <p className="text-xs text-muted-foreground">De presupuestos aprobados, pesos actualizados por CAC</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presupuestos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPresupuestos || loadingPagos ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Cargando…</p>
          ) : resumen.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Este cliente todavía no tiene presupuestos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cobrado</TableHead>
                  <TableHead className="text-right">Saldo base</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumen.map((r) => {
                  const { presupuesto, total, cobradoNominal, moneda } = r
                  return (
                  <TableRow key={presupuesto.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {presupuesto.numero}
                      {presupuesto.revision > 0 && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {revisionLabel(presupuesto.revision)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(presupuesto.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant={estadoBadgeVariant(presupuesto.estado)}>{estadoLabel(presupuesto.estado)}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(total, moneda)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(cobradoNominal, moneda)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {esCobrable(r) ? formatCurrency(saldoPendiente(r), moneda) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Ver presupuesto" asChild>
                        <Link to={`/presupuestos/${presupuesto.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pagosCliente.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosCliente.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="text-muted-foreground">{formatDate(pago.fecha)}</TableCell>
                    <TableCell>N° {numeroPorPresupuesto.get(pago.presupuestoId) ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{metodoLabel(pago.metodo)}</TableCell>
                    <TableCell className="text-muted-foreground">{pago.notas || '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <DetalleMontoPago pago={pago} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ReciboButton
                        pago={pago}
                        presupuesto={presupuestosCliente.find((p) => p.id === pago.presupuestoId)}
                        pagos={pagosCliente}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {cliente.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{cliente.notas}</CardContent>
        </Card>
      )}

      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={cliente}
        onSubmit={handleSubmit}
        submitting={updateCliente.isPending}
      />
    </div>
  )
}
