import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreatePago } from '@/hooks/usePagos'
import { useIndicesCac } from '@/hooks/useIndicesCac'
import { calcularActualizacion } from '@/lib/indicesCac'
import { calcularResumenCobros, calcularResumenEtapas } from '@/lib/cobros'
import { actualizaPorCac, mesAnterior, type Presupuesto } from '@/types/presupuesto'
import { METODOS_PAGO, type MetodoPago, type Pago, type PagoInput } from '@/types/pago'
import { formatCurrency, formatMes } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const SIN_ETAPA = '__sin_etapa__'
const redondear2 = (n: number) => Math.round(n * 100) / 100

export function PagoFormDialog({
  presupuesto,
  pagos,
  open,
  onOpenChange,
  etapaIdInicial,
}: {
  presupuesto: Presupuesto | null
  pagos: Pago[]
  open: boolean
  onOpenChange: (open: boolean) => void
  etapaIdInicial?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {presupuesto ? `Presupuesto N° ${presupuesto.numero} — ${presupuesto.clienteNombre}` : ''}
          </DialogDescription>
        </DialogHeader>
        {/* Se monta al abrir, así el estado arranca de cero en cada apertura. */}
        {presupuesto && (
          <PagoForm
            presupuesto={presupuesto}
            pagos={pagos}
            etapaIdInicial={etapaIdInicial}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PagoForm({
  presupuesto,
  pagos,
  etapaIdInicial,
  onDone,
}: {
  presupuesto: Presupuesto
  pagos: Pago[]
  etapaIdInicial?: string
  onDone: () => void
}) {
  const createPago = useCreatePago()
  const { data: indices } = useIndicesCac()
  const money = (value: number) => formatCurrency(value, presupuesto.moneda)

  const [resumen] = calcularResumenCobros([presupuesto], pagos)
  const { etapas } = calcularResumenEtapas(presupuesto, pagos)
  const pendienteDe = (etapaId: string) =>
    etapaId === SIN_ETAPA ? Math.max(resumen.saldo, 0) : (etapas.find((e) => e.etapa.id === etapaId)?.pendiente ?? 0)

  const etapaPorDefecto =
    etapaIdInicial ?? etapas.find((e) => e.pendiente > 0.005)?.etapa.id ?? (etapas.length > 0 ? etapas[0].etapa.id : SIN_ETAPA)

  const hoy = new Date().toISOString().slice(0, 10)
  const [fecha, setFecha] = useState(hoy)
  const [etapaId, setEtapaId] = useState(etapaPorDefecto)
  const [montoBase, setMontoBase] = useState(() => redondear2(pendienteDe(etapaPorDefecto)))
  const [actualizar, setActualizar] = useState(actualizaPorCac(presupuesto))
  const [mesIndice, setMesIndice] = useState(mesAnterior(hoy))
  const [mesIndiceManual, setMesIndiceManual] = useState(false)
  const [metodo, setMetodo] = useState<MetodoPago>('transferencia')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)

  const actualizacion = actualizar ? calcularActualizacion(indices ?? [], presupuesto.mesBaseCac, mesIndice) : null
  const faltaIndice = actualizar && !actualizacion
  const coeficiente = actualizar ? (actualizacion?.coeficiente ?? 1) : 1
  const monto = redondear2(montoBase * coeficiente)

  function cambiarFecha(value: string) {
    setFecha(value)
    // El índice por defecto es el del mes anterior al pago (el último publicado).
    if (!mesIndiceManual && value) setMesIndice(mesAnterior(value))
  }

  function cambiarEtapa(value: string) {
    if (!value) return
    setEtapaId(value)
    setMontoBase(redondear2(pendienteDe(value)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!montoBase || montoBase <= 0) {
      setError('Ingresá un monto válido.')
      return
    }
    if (faltaIndice) {
      setError('Falta cargar el índice CAC necesario, o desmarcá la actualización.')
      return
    }
    setError(null)
    const input: PagoInput = {
      presupuestoId: presupuesto.id,
      clienteId: presupuesto.clienteId,
      clienteNombre: presupuesto.clienteNombre,
      fecha,
      monto,
      moneda: presupuesto.moneda,
      etapaId: etapaId === SIN_ETAPA ? '' : etapaId,
      montoBase: redondear2(montoBase),
      mesIndice: actualizar && coeficiente !== 1 ? mesIndice : '',
      coeficiente,
      metodo,
      notas,
    }
    try {
      await createPago.mutateAsync(input)
      onDone()
    } catch {
      setError('No se pudo registrar el pago. Intentá de nuevo.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="etapa">Etapa</Label>
          <Select value={etapaId} onValueChange={cambiarEtapa}>
            <SelectTrigger id="etapa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {etapas.map(({ etapa, pendiente }) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.descripcion || 'Etapa sin nombre'} — pendiente {money(pendiente)}
                </SelectItem>
              ))}
              <SelectItem value={SIN_ETAPA}>Sin etapa (a cuenta del saldo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fecha">Fecha del pago</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} />
        </div>
      </div>

      {actualizaPorCac(presupuesto) && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={actualizar} onChange={(e) => setActualizar(e.target.checked)} />
            Actualizar por índice CAC
          </label>
          {actualizar && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Mes base</Label>
                  <p className="text-sm first-letter:uppercase">{formatMes(presupuesto.mesBaseCac)}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mesIndice">Índice aplicado</Label>
                  <Input
                    id="mesIndice"
                    type="month"
                    value={mesIndice}
                    onChange={(e) => {
                      setMesIndice(e.target.value)
                      setMesIndiceManual(true)
                    }}
                  />
                </div>
              </div>
              {actualizacion ? (
                <p className="text-xs text-muted-foreground">
                  CAC base {actualizacion.indiceBase.toLocaleString('es-AR')} → CAC aplicado{' '}
                  {actualizacion.indiceAplicado.toLocaleString('es-AR')} · coeficiente{' '}
                  <span className="font-medium text-foreground">
                    {coeficiente.toLocaleString('es-AR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </span>
                  {coeficiente === 1 && ' (sin variación: el mes aplicado no es posterior al base)'}
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  Falta el índice CAC de {formatMes(presupuesto.mesBaseCac)} o de {formatMes(mesIndice)}.{' '}
                  <Link to="/indices" className="underline">
                    Cargar índices
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="montoBase">
            {actualizar ? `Cancela (a valores de ${formatMes(presupuesto.mesBaseCac)})` : 'Monto'}
          </Label>
          <Input
            id="montoBase"
            type="number"
            min={0}
            step="0.01"
            required
            value={montoBase}
            onChange={(e) => setMontoBase(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Pendiente: {money(pendienteDe(etapaId))}</p>
        </div>
        {actualizar && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto">A cobrar (actualizado)</Label>
            <Input
              id="monto"
              type="number"
              min={0}
              step="0.01"
              disabled={faltaIndice}
              value={monto}
              onChange={(e) => setMontoBase(Number(e.target.value) / coeficiente)}
            />
            <p className="text-xs text-muted-foreground">Podés cargar lo cobrado y se calcula lo que cancela.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metodo">Método</Label>
        <Select value={metodo} onValueChange={(v) => v && setMetodo(v as MetodoPago)}>
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
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createPago.isPending}>
          {createPago.isPending ? 'Guardando…' : `Registrar ${money(monto)}`}
        </Button>
      </DialogFooter>
    </form>
  )
}
