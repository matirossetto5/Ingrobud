import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Pencil } from 'lucide-react'
import { usePresupuesto } from '@/hooks/usePresupuestos'
import { calcularSubtotalSeccion, calcularTotalPresupuesto, estadoBadgeVariant, estadoLabel } from '@/types/presupuesto'
import { generarPresupuestoPdf } from '@/lib/presupuestoPdf'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export function PresupuestoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: presupuesto, isLoading, isError } = usePresupuesto(id)

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

  const total = calcularTotalPresupuesto(presupuesto.secciones)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Presupuesto N° {presupuesto.numero}</h1>
            <Badge variant={estadoBadgeVariant(presupuesto.estado)}>{estadoLabel(presupuesto.estado)}</Badge>
          </div>
          <p className="text-muted-foreground">{presupuesto.clienteNombre || 'Sin cliente'}</p>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={() => generarPresupuestoPdf(presupuesto)}>
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Fecha</p>
            <p>{formatDate(presupuesto.fecha) || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Válido hasta</p>
            <p>{formatDate(presupuesto.validoHasta) || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="font-semibold">{formatCurrency(total)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {presupuesto.secciones.map((seccion) => (
          <Card key={seccion.id}>
            <CardHeader>
              <CardTitle className="text-base">{seccion.titulo || 'Ítems'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seccion.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.descripcion || '—'}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.cantidad * item.precioUnitario)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border px-3 py-3 text-right text-sm text-muted-foreground">
                Subtotal: <span className="font-medium text-foreground">{formatCurrency(calcularSubtotalSeccion(seccion))}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {presupuesto.notas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{presupuesto.notas}</CardContent>
        </Card>
      )}
    </div>
  )
}
