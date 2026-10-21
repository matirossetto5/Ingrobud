import { Plus, Trash2 } from 'lucide-react'
import { montoEtapa, nuevaEtapa, sumaPorcentajes, type EtapaPago, type Moneda } from '@/types/presupuesto'
import { formatCurrency, formatPorcentaje } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const redondear2 = (n: number) => Math.round(n * 100) / 100

/**
 * Plan de pagos por etapas. Se puede cargar el porcentaje o el monto: lo que se guarda es el
 * porcentaje, y el monto se recalcula sobre el total.
 */
export function EtapasPagoEditor({
  etapas,
  total,
  moneda,
  onChange,
}: {
  etapas: EtapaPago[]
  total: number
  moneda: Moneda
  onChange: (etapas: EtapaPago[]) => void
}) {
  const suma = sumaPorcentajes(etapas)
  const resto = redondear2(100 - suma)

  function updateEtapa(id: string, patch: Partial<EtapaPago>) {
    onChange(etapas.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function asignarRestoAUltima() {
    const ultima = etapas[etapas.length - 1]
    if (ultima) updateEtapa(ultima.id, { porcentaje: redondear2(ultima.porcentaje + resto) })
  }

  return (
    <div className="flex flex-col gap-3">
      {etapas.length > 0 && (
        <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-muted-foreground sm:grid">
          <span className="col-span-6">Etapa</span>
          <span className="col-span-2">%</span>
          <span className="col-span-3">Monto</span>
        </div>
      )}
      {etapas.map((etapa, index) => (
        <div key={etapa.id} className="grid grid-cols-12 gap-2">
          <Input
            className="col-span-12 sm:col-span-6"
            placeholder={index === 0 ? 'Ej.: Anticipo' : 'Ej.: Entrega de planos'}
            aria-label="Descripción de la etapa"
            value={etapa.descripcion}
            onChange={(e) => updateEtapa(etapa.id, { descripcion: e.target.value })}
          />
          <Input
            className="col-span-4 sm:col-span-2"
            type="number"
            min={0}
            max={100}
            step="0.01"
            aria-label="Porcentaje de la etapa"
            value={etapa.porcentaje}
            onChange={(e) => updateEtapa(etapa.id, { porcentaje: Number(e.target.value) })}
          />
          <Input
            className="col-span-6 sm:col-span-3"
            type="number"
            min={0}
            step="0.01"
            aria-label="Monto de la etapa"
            disabled={total <= 0}
            value={redondear2(montoEtapa(total, etapa))}
            onChange={(e) => updateEtapa(etapa.id, { porcentaje: (Number(e.target.value) / total) * 100 })}
          />
          <div className="col-span-2 flex items-center justify-end sm:col-span-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar etapa"
              onClick={() => onChange(etapas.filter((e) => e.id !== etapa.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...etapas, nuevaEtapa('', Math.max(resto, 0))])}>
          <Plus className="h-4 w-4" />
          Etapa
        </Button>
        {etapas.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            {resto !== 0 && (
              <>
                <span className="text-destructive">
                  {resto > 0 ? `Faltan ${formatPorcentaje(resto)}` : `Sobran ${formatPorcentaje(-resto)}`}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={asignarRestoAUltima}>
                  Ajustar última etapa
                </Button>
              </>
            )}
            <span className="text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatPorcentaje(redondear2(suma))}</span> ·{' '}
              {formatCurrency((total * suma) / 100, moneda)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
