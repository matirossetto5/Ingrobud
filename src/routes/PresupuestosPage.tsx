import { Link } from 'react-router-dom'
import { Plus, FileDown, Pencil, Trash2, Eye } from 'lucide-react'
import { usePresupuestos, useDeletePresupuesto } from '@/hooks/usePresupuestos'
import { calcularTotalPresupuesto, estadoBadgeVariant, estadoLabel } from '@/types/presupuesto'
import type { Presupuesto } from '@/types/presupuesto'
import { generarPresupuestoPdf } from '@/lib/presupuestoPdf'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function PresupuestosPage() {
  const { data: presupuestos, isLoading, isError } = usePresupuestos()
  const deletePresupuesto = useDeletePresupuesto()

  async function handleDelete(presupuesto: Presupuesto) {
    if (!window.confirm(`¿Eliminar el presupuesto N° ${presupuesto.numero}? Esta acción no se puede deshacer.`)) return
    await deletePresupuesto.mutateAsync(presupuesto.id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Presupuestos</h1>
          <p className="text-muted-foreground">Creación, envío y seguimiento de presupuestos.</p>
        </div>
        <Button asChild>
          <Link to="/presupuestos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Link>
        </Button>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">No se pudieron cargar los presupuestos.</CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando presupuestos…</CardContent>
        </Card>
      ) : !presupuestos || presupuestos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Todavía no creaste ningún presupuesto.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presupuestos.map((presupuesto) => (
                <TableRow key={presupuesto.id}>
                  <TableCell className="font-medium">{presupuesto.numero}</TableCell>
                  <TableCell className="text-muted-foreground">{presupuesto.clienteNombre || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(presupuesto.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={estadoBadgeVariant(presupuesto.estado)}>{estadoLabel(presupuesto.estado)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(calcularTotalPresupuesto(presupuesto.secciones))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Ver" asChild>
                        <Link to={`/presupuestos/${presupuesto.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Editar" asChild>
                        <Link to={`/presupuestos/${presupuesto.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Descargar PDF"
                        onClick={() => generarPresupuestoPdf(presupuesto)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(presupuesto)}
                        disabled={deletePresupuesto.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
