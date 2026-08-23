import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { usePresupuesto, useCreatePresupuesto, useUpdatePresupuesto } from '@/hooks/usePresupuestos'
import {
  ESTADOS_PRESUPUESTO,
  calcularSubtotalSeccion,
  calcularTotalPresupuesto,
  emptyPresupuestoInput,
  nuevaSeccion,
  nuevoItem,
  type PresupuestoInput,
  type PresupuestoSeccion,
} from '@/types/presupuesto'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function PresupuestoFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const { data: clientes } = useClientes()
  const { data: presupuesto, isLoading } = usePresupuesto(id)
  const createPresupuesto = useCreatePresupuesto()
  const updatePresupuesto = useUpdatePresupuesto()

  const [form, setForm] = useState<PresupuestoInput>(emptyPresupuestoInput)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (presupuesto) {
      setForm({
        clienteId: presupuesto.clienteId,
        clienteNombre: presupuesto.clienteNombre,
        fecha: presupuesto.fecha,
        validoHasta: presupuesto.validoHasta,
        estado: presupuesto.estado,
        secciones: presupuesto.secciones,
        notas: presupuesto.notas,
      })
    }
  }, [presupuesto])

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando presupuesto…</p>
  }

  function update<K extends keyof PresupuestoInput>(key: K, value: PresupuestoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateCliente(clienteId: string) {
    const cliente = clientes?.find((c) => c.id === clienteId)
    setForm((f) => ({ ...f, clienteId, clienteNombre: cliente?.nombre ?? '' }))
  }

  function updateSecciones(updater: (secciones: PresupuestoSeccion[]) => PresupuestoSeccion[]) {
    setForm((f) => ({ ...f, secciones: updater(f.secciones) }))
  }

  function addSeccion() {
    updateSecciones((secciones) => [...secciones, nuevaSeccion()])
  }

  function removeSeccion(seccionId: string) {
    updateSecciones((secciones) => secciones.filter((s) => s.id !== seccionId))
  }

  function updateSeccionTitulo(seccionId: string, titulo: string) {
    updateSecciones((secciones) => secciones.map((s) => (s.id === seccionId ? { ...s, titulo } : s)))
  }

  function addItem(seccionId: string) {
    updateSecciones((secciones) =>
      secciones.map((s) => (s.id === seccionId ? { ...s, items: [...s.items, nuevoItem()] } : s)),
    )
  }

  function removeItem(seccionId: string, itemId: string) {
    updateSecciones((secciones) =>
      secciones.map((s) => (s.id === seccionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)),
    )
  }

  function updateItem(
    seccionId: string,
    itemId: string,
    patch: Partial<{ descripcion: string; cantidad: number; precioUnitario: number }>,
  ) {
    updateSecciones((secciones) =>
      secciones.map((s) =>
        s.id === seccionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
          : s,
      ),
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.clienteId) {
      setError('Elegí un cliente.')
      return
    }
    if (form.secciones.every((s) => s.items.every((i) => !i.descripcion.trim()))) {
      setError('Agregá al menos un ítem con descripción.')
      return
    }
    setError(null)
    try {
      if (isEdit && id) {
        await updatePresupuesto.mutateAsync({ id, input: form })
        navigate(`/presupuestos/${id}`)
      } else {
        const newId = await createPresupuesto.mutateAsync(form)
        navigate(`/presupuestos/${newId}`)
      }
    } catch {
      setError('No se pudo guardar el presupuesto. Intentá de nuevo.')
    }
  }

  const total = calcularTotalPresupuesto(form.secciones)
  const submitting = createPresupuesto.isPending || updatePresupuesto.isPending

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h1>
        <p className="text-muted-foreground">Armá el presupuesto por secciones e ítems.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={form.clienteId} onValueChange={updateCliente}>
              <SelectTrigger id="cliente">
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {(clientes ?? []).map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select value={form.estado} onValueChange={(v) => update('estado', v as PresupuestoInput['estado'])}>
              <SelectTrigger id="estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_PRESUPUESTO.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={form.fecha} onChange={(e) => update('fecha', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validoHasta">Válido hasta</Label>
            <Input
              id="validoHasta"
              type="date"
              value={form.validoHasta}
              onChange={(e) => update('validoHasta', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {form.secciones.map((seccion, index) => (
          <Card key={seccion.id}>
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
              <div className="flex-1">
                <Input
                  placeholder={`Título de la sección ${index + 1}`}
                  value={seccion.titulo}
                  onChange={(e) => updateSeccionTitulo(seccion.id, e.target.value)}
                />
              </div>
              {form.secciones.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar sección"
                  onClick={() => removeSeccion(seccion.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {seccion.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-12 sm:col-span-6"
                    placeholder="Descripción"
                    value={item.descripcion}
                    onChange={(e) => updateItem(seccion.id, item.id, { descripcion: e.target.value })}
                  />
                  <Input
                    className="col-span-4 sm:col-span-2"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Cantidad"
                    value={item.cantidad}
                    onChange={(e) => updateItem(seccion.id, item.id, { cantidad: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-6 sm:col-span-3"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Precio unit."
                    value={item.precioUnitario}
                    onChange={(e) => updateItem(seccion.id, item.id, { precioUnitario: Number(e.target.value) })}
                  />
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                    {seccion.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar ítem"
                        onClick={() => removeItem(seccion.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(seccion.id)}>
                  <Plus className="h-4 w-4" />
                  Ítem
                </Button>
                <p className="text-sm text-muted-foreground">
                  Subtotal: <span className="font-medium text-foreground">{formatCurrency(calcularSubtotalSeccion(seccion))}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addSeccion} className="self-start">
          <Plus className="h-4 w-4" />
          Sección
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={form.notas} onChange={(e) => update('notas', e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-2 text-lg font-semibold">
            Total: {formatCurrency(total)}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
