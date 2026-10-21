import { useEffect, useState, type FormEvent } from 'react'
import type { Cliente, ClienteInput } from '@/types/cliente'
import { emptyClienteInput } from '@/types/cliente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onSubmit: (input: ClienteInput) => Promise<void>
  submitting: boolean
}) {
  const [form, setForm] = useState<ClienteInput>(cliente ?? emptyClienteInput)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(cliente ?? emptyClienteInput)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente?.id])

  function update<K extends keyof ClienteInput>(key: K, value: ClienteInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setError(null)
    try {
      await onSubmit(form)
    } catch {
      setError('No se pudo guardar el cliente. Intentá de nuevo.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>Completá los datos de contacto del cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" required value={form.nombre} onChange={(e) => update('nombre', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresa">Empresa</Label>
            <Input id="empresa" value={form.empresa} onChange={(e) => update('empresa', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={form.telefono} onChange={(e) => update('telefono', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" value={form.direccion} onChange={(e) => update('direccion', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={form.notas} onChange={(e) => update('notas', e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
