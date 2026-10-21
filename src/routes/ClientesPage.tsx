import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Mail, Phone, Eye } from 'lucide-react'
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes'
import type { Cliente, ClienteInput } from '@/types/cliente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'

export function ClientesPage() {
  const { data: clientes, isLoading, isError } = useClientes()
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const deleteCliente = useDeleteCliente()

  const [search, setSearch] = useState('')
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = (clientes ?? []).filter((c) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return c.nombre.toLowerCase().includes(term) || c.empresa.toLowerCase().includes(term)
  })

  function openNewDialog() {
    setEditingCliente(null)
    setDialogOpen(true)
  }

  function openEditDialog(cliente: Cliente) {
    setEditingCliente(cliente)
    setDialogOpen(true)
  }

  async function handleDelete(cliente: Cliente) {
    if (!window.confirm(`¿Eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return
    await deleteCliente.mutateAsync(cliente.id)
  }

  async function handleSubmit(input: ClienteInput) {
    if (editingCliente) {
      await updateCliente.mutateAsync({ id: editingCliente.id, input })
    } else {
      await createCliente.mutateAsync(input)
    }
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground">Alta, edición e historial de clientes.</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o empresa…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">No se pudieron cargar los clientes.</CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando clientes…</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {clientes && clientes.length > 0 ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no cargaste ningún cliente.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    <Link to={`/clientes/${cliente.id}`} className="hover:underline">
                      {cliente.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cliente.empresa || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      {cliente.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {cliente.email}
                        </span>
                      )}
                      {cliente.telefono && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {cliente.telefono}
                        </span>
                      )}
                      {!cliente.email && !cliente.telefono && '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Ver ficha" asChild>
                        <Link to={`/clientes/${cliente.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEditDialog(cliente)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(cliente)}
                        disabled={deleteCliente.isPending}
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

      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={editingCliente}
        onSubmit={handleSubmit}
        submitting={createCliente.isPending || updateCliente.isPending}
      />
    </div>
  )
}
