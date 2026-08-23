import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePagos, useCreatePago, useDeletePago } from '@/hooks/usePagos'
import { calcularResumenCobros, type ResumenCobro } from '@/lib/cobros'
import { METODOS_PAGO, metodoLabel, type MetodoPago, type PagoInput } from '@/types/pago'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function CobrosPage() {
  const { data: presupuestos, isLoading: loadingPresupuestos } = usePresupuestos()
  const { data: pagos, isLoading: loadingPagos } = usePagos()
  const deletePago = useDeletePago()

  const [dialogPresupuestoId, setDialogPresupuestoId] = useState<string | null>(null)

  const isLoading = loadingPresupuestos || loadingPagos
  const resumen = calcularResumenCobros(presupuestos ?? [], pagos ?? [])
    .filter((r) => r.total > 0)
    .sort((a, b) => b.saldo - a.saldo)

  const totalCobrado = resumen.reduce((sum, r) => sum + r.cobrado, 0)
  const totalPendiente = resumen.reduce((sum, r) => sum + Math.max(r.saldo, 0), 0)

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
            <p className="text-2xl font-semibold">{formatCurrency(totalCobrado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalPendiente)}</p>
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
            No hay presupuestos con montos para cobrar todavía.
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
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumen.map((r) => (
                <TableRow key={r.presupuesto.id}>
                  <TableCell className="font-medium">{r.presupuesto.numero}</TableCell>
                  <TableCell className="text-muted-foreground">{r.presupuesto.clienteNombre || '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.total)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.cobrado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Math.max(r.saldo, 0))}</TableCell>
                  <TableCell>
                    <EstadoCobroBadge resumen={r} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={r.saldo <= 0}
                      onClick={() => setDialogPresupuestoId(r.presupuesto.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Registrar pago
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                  <TableHead>N° presupuesto</TableHead>
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
                      <TableCell className="text-muted-foreground">{presupuesto?.numero ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{metodoLabel(pago.metodo)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pago.monto)}</TableCell>
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
        resumen={resumen.find((r) => r.presupuesto.id === dialogPresupuestoId) ?? null}
        open={dialogPresupuestoId !== null}
        onOpenChange={(open) => setDialogPresupuestoId(open ? dialogPresupuestoId : null)}
      />
    </div>
  )
}

function EstadoCobroBadge({ resumen }: { resumen: ResumenCobro }) {
  if (resumen.saldo <= 0) return <Badge variant="success">Pagado</Badge>
  if (resumen.cobrado > 0) return <Badge variant="primary">Parcial</Badge>
  return <Badge variant="default">Pendiente</Badge>
}

function PagoFormDialog({
  resumen,
  open,
  onOpenChange,
}: {
  resumen: ResumenCobro | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createPago = useCreatePago()
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && resumen) {
      setFecha(new Date().toISOString().slice(0, 10))
      setMonto(resumen.saldo > 0 ? String(resumen.saldo) : '')
      setMetodo('efectivo')
      setNotas('')
      setError(null)
    }
  }, [open, resumen])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!resumen) return
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    setError(null)
    const input: PagoInput = {
      presupuestoId: resumen.presupuesto.id,
      clienteId: resumen.presupuesto.clienteId,
      clienteNombre: resumen.presupuesto.clienteNombre,
      fecha,
      monto: montoNum,
      metodo,
      notas,
    }
    try {
      await createPago.mutateAsync(input)
      onOpenChange(false)
    } catch {
      setError('No se pudo registrar el pago. Intentá de nuevo.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {resumen ? `Presupuesto N° ${resumen.presupuesto.numero} — ${resumen.presupuesto.clienteNombre}` : ''}
          </DialogDescription>
        </DialogHeader>
        {resumen && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Saldo pendiente: <span className="font-medium text-foreground">{formatCurrency(resumen.saldo)}</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="metodo">Método</Label>
              <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                <SelectTrigger id="metodo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPago.isPending}>
                {createPago.isPending ? 'Guardando…' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
