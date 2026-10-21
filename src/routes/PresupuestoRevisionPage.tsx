import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'
import { usePresupuesto, useRevision } from '@/hooks/usePresupuestos'
import { estadoBadgeVariant, estadoLabel, revisionLabel, type PresupuestoVersion } from '@/types/presupuesto'
import { generarPresupuestoPdf } from '@/lib/presupuestoPdf'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PresupuestoContenido } from '@/components/presupuestos/PresupuestoContenido'

export function PresupuestoRevisionPage() {
  const { id, revision: revisionParam } = useParams<{ id: string; revision: string }>()
  const navigate = useNavigate()
  const revisionNumero = Number(revisionParam)
  const { data: presupuesto, isLoading: loadingPresupuesto } = usePresupuesto(id)
  const { data: revision, isLoading: loadingRevision, isError } = useRevision(id, revisionNumero)

  if (loadingPresupuesto || loadingRevision) {
    return <p className="text-sm text-muted-foreground">Cargando revisión…</p>
  }

  if (isError || !presupuesto || !revision) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">No se encontró la revisión.</p>
        <Button variant="outline" className="self-start" onClick={() => navigate(`/presupuestos/${id ?? ''}`)}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    )
  }

  const version: PresupuestoVersion = { ...revision, numero: presupuesto.numero, clienteId: presupuesto.clienteId }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">Presupuesto N° {presupuesto.numero}</h1>
            <Badge>{revisionLabel(revision.revision)}</Badge>
            <Badge variant={estadoBadgeVariant(revision.estado)}>{estadoLabel(revision.estado)}</Badge>
          </div>
          <p className="text-muted-foreground">{revision.clienteNombre || 'Sin cliente'}</p>
          {revision.motivoRevision && (
            <p className="mt-1 text-sm text-muted-foreground">
              Motivo de la revisión: <span className="text-foreground">{revision.motivoRevision}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/presupuestos/${presupuesto.id}`)}>
            <ArrowLeft className="h-4 w-4" />
            Ir a la vigente
          </Button>
          <Button onClick={() => generarPresupuestoPdf(version)}>
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Esta es una versión archivada (solo lectura). La versión vigente es la{' '}
          <span className="font-medium text-foreground">{revisionLabel(presupuesto.revision)}</span>.
        </CardContent>
      </Card>

      <PresupuestoContenido presupuesto={version} />
    </div>
  )
}
