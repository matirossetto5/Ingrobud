import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useDeleteIndiceCac, useIndicesCac, useSaveIndiceCac } from '@/hooks/useIndicesCac'
import { mesAnterior } from '@/types/presupuesto'
import { formatMes, formatPorcentaje } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function IndicesPage() {
  const { data: indices, isLoading, isError } = useIndicesCac()
  const saveIndice = useSaveIndiceCac()
  const deleteIndice = useDeleteIndiceCac()

  const [mes, setMes] = useState(() => mesAnterior(new Date().toISOString().slice(0, 10)))
  const [valor, setValor] = useState('')
  const [error, setError] = useState<string | null>(null)

  const existente = indices?.find((i) => i.mes === mes)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const valorNum = Number(valor.replace(/\./g, '').replace(',', '.'))
    if (!mes) {
      setError('Elegí el mes.')
      return
    }
    if (!valorNum || valorNum <= 0) {
      setError('Ingresá un valor válido.')
      return
    }
    setError(null)
    try {
      await saveIndice.mutateAsync({ mes, valor: valorNum })
      setValor('')
    } catch {
      setError('No se pudo guardar el índice. Intentá de nuevo.')
    }
  }

  async function handleDelete(mesIndice: string) {
    if (!window.confirm(`¿Eliminar el índice de ${formatMes(mesIndice)}?`)) return
    await deleteIndice.mutateAsync(mesIndice)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Índices CAC</h1>
        <p className="text-muted-foreground">
          Índice del costo de la construcción de la Cámara Argentina de la Construcción (nivel general). Se usa para
          actualizar los saldos de los presupuestos en pesos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{existente ? 'Corregir índice' : 'Cargar índice'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mes">Mes</Label>
              <Input id="mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor del índice</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder={existente ? existente.valor.toLocaleString('es-AR') : 'Ej.: 15234,7'}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saveIndice.isPending}>
              {saveIndice.isPending ? 'Guardando…' : existente ? 'Actualizar' : 'Guardar'}
            </Button>
          </form>
          {existente && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ya hay un valor para {formatMes(mes)} ({existente.valor.toLocaleString('es-AR')}); se va a reemplazar.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">No se pudieron cargar los índices.</CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando índices…</CardContent>
        </Card>
      ) : !indices || indices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Todavía no cargaste ningún índice.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Índice</TableHead>
                <TableHead className="text-right">Variación mensual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indices.map((indice) => {
                const previo = indices.find((i) => i.mes === mesAnterior(indice.mes))
                return (
                  <TableRow key={indice.mes}>
                    <TableCell className="first-letter:uppercase">{formatMes(indice.mes)}</TableCell>
                    <TableCell className="text-right">{indice.valor.toLocaleString('es-AR')}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {previo ? formatPorcentaje(Math.round((indice.valor / previo.valor - 1) * 10000) / 100) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Corregir"
                          onClick={() => {
                            setMes(indice.mes)
                            setValor(String(indice.valor).replace('.', ','))
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar"
                          onClick={() => handleDelete(indice.mes)}
                          disabled={deleteIndice.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
