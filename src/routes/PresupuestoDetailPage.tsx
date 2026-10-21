import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, FileDown, GitBranchPlus, Pencil } from 'lucide-react'
import { useCrearRevision, usePresupuesto, useRevisiones } from '@/hooks/usePresupuestos'
import {
  calcularTotalPresupuesto,
  estadoBadgeVariant,
  estadoLabel,
  revisionLabel,
  type Presupuesto,
  type PresupuestoVersion,
} from '@/types/presupuesto'
import { generarPresupuestoPdf } from '@/lib/presupuestoPdf'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PresupuestoContenido } from '@/components/presupuestos/PresupuestoContenido'

export function PresupuestoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: presupuesto, isLoading, isError } = usePresupuesto(id)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando presupuesto…</p>
  }

  if (isError || !presupuesto) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">No se encontró el presupuesto.</p>
        <Button variant="outline" className="self-start" onClick={() => navigate('/presupuestos')}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  // Un borrador se corrige editándolo; una vez presentado al cliente, los cambios van en una revisión nueva.
  const yaPresentado = presupuesto.estado !== 'borrador'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">Presupuesto N° {presupuesto.numero}</h1>
            <Badge>{revisionLabel(presupuesto.revision)}</Badge>
            <Badge variant={estadoBadgeVariant(presupuesto.estado)}>{estadoLabel(presupuesto.estado)}</Badge>
          </div>
          <p className="text-muted-foreground">{presupuesto.clienteNombre || 'Sin cliente'}</p>
          {presupuesto.motivoRevision && (
            <p className="mt-1 text-sm text-muted-foreground">
              Motivo de la revisión: <span className="text-foreground">{presupuesto.motivoRevision}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/presupuestos')}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/presupuestos/${presupuesto.id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant={yaPresentado ? 'default' : 'outline'} onClick={() => setRevisionDialogOpen(true)}>
            <GitBranchPlus className="h-4 w-4" />
            Nueva revisión
          </Button>
          <Button variant={yaPresentado ? 'outline' : 'default'} onClick={() => generarPresupuestoPdf(presupuesto)}>
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <PresupuestoContenido presupuesto={presupuesto} />

      <HistorialRevisiones presupuesto={presupuesto} />

      <NuevaRevisionDialog
        presupuesto={presupuesto}
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        onCreated={() => navigate(`/presupuestos/${presupuesto.id}/editar`)}
      />
    </div>
  )
}

function HistorialRevisiones({ presupuesto }: { presupuesto: Presupuesto }) {
  const { data: revisiones, isLoading, isError } = useRevisiones(presupuesto.id)

  const filas: (PresupuestoVersion & { motivoRevision: string; vigente: boolean })[] = [
    { ...presupuesto, vigente: true },
    ...(revisiones ?? []).map((r) => ({ ...r, numero: presupuesto.numero, vigente: false })),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de revisiones</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isError && <p className="px-6 pb-4 text-sm text-destructive">No se pudo cargar el historial.</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Revisión</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.revision}>
                <TableCell className="font-medium whitespace-nowrap">
                  {revisionLabel(fila.revision)}
                  {fila.vigente && <span className="ml-2 text-xs font-normal text-muted-foreground">(vigente)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(fila.fecha) || '—'}</TableCell>
                <TableCell>
                  <Badge variant={estadoBadgeVariant(fila.estado)}>{estadoLabel(fila.estado)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {fila.motivoRevision || (fila.revision === 0 ? 'Versión original' : '—')}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCurrency(calcularTotalPresupuesto(fila.secciones))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!fila.vigente && (
                      <Button variant="ghost" size="icon" aria-label="Ver revisión" asChild>
                        <Link to={`/presupuestos/${presupuesto.id}/revisiones/${fila.revision}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Descargar PDF"
                      onClick={() => generarPresupuestoPdf(fila)}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isLoading && <p className="px-6 py-3 text-sm text-muted-foreground">Cargando revisiones anteriores…</p>}
      </CardContent>
    </Card>
  )
}

function NuevaRevisionDialog({
  presupuesto,
  open,
  onOpenChange,
  onCreated,
}: {
  presupuesto: Presupuesto
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const crearRevision = useCrearRevision()
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!motivo.trim()) {
      setError('Contá brevemente qué cambia en esta revisión.')
      return
    }
    setError(null)
    try {
      await crearRevision.mutateAsync({ presupuesto, motivo: motivo.trim() })
      setMotivo('')
      onOpenChange(false)
      onCreated()
    } catch {
      setError('No se pudo crear la revisión. Intentá de nuevo.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva revisión ({revisionLabel(presupuesto.revision + 1)})</DialogTitle>
            <DialogDescription>
              La {revisionLabel(presupuesto.revision)} queda guardada tal como está en el historial. La nueva revisión
              arranca como borrador con el mismo contenido para que la modifiques.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              placeholder="Ej.: el cliente pidió quitar la sección de pintura y ajustar cantidades"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crearRevision.isPending}>
              {crearRevision.isPending ? 'Creando…' : 'Crear y editar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
