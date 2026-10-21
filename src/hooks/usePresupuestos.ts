import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  crearRevision,
  createPresupuesto,
  deletePresupuesto,
  getPresupuesto,
  getPresupuestos,
  getRevision,
  getRevisiones,
  updatePresupuesto,
} from '@/lib/presupuestos'
import type { Presupuesto, PresupuestoInput } from '@/types/presupuesto'

const presupuestosKey = ['presupuestos'] as const
const presupuestoKey = (id: string) => ['presupuestos', id] as const
const revisionesKey = (id: string) => ['presupuestos', id, 'revisiones'] as const

export function usePresupuestos() {
  return useQuery({ queryKey: presupuestosKey, queryFn: getPresupuestos })
}

export function usePresupuesto(id: string | undefined) {
  return useQuery({
    queryKey: presupuestoKey(id ?? ''),
    queryFn: () => getPresupuesto(id!),
    enabled: Boolean(id),
  })
}

export function useCreatePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PresupuestoInput) => createPresupuesto(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: presupuestosKey }),
  })
}

export function useUpdatePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PresupuestoInput }) => updatePresupuesto(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: presupuestosKey })
      queryClient.invalidateQueries({ queryKey: presupuestoKey(variables.id) })
    },
  })
}

export function useDeletePresupuesto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePresupuesto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: presupuestosKey }),
  })
}

export function useRevisiones(presupuestoId: string | undefined) {
  return useQuery({
    queryKey: revisionesKey(presupuestoId ?? ''),
    queryFn: () => getRevisiones(presupuestoId!),
    enabled: Boolean(presupuestoId),
  })
}

export function useRevision(presupuestoId: string | undefined, revision: number) {
  return useQuery({
    queryKey: [...revisionesKey(presupuestoId ?? ''), revision],
    queryFn: () => getRevision(presupuestoId!, revision),
    enabled: Boolean(presupuestoId) && Number.isInteger(revision),
  })
}

export function useCrearRevision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ presupuesto, motivo }: { presupuesto: Presupuesto; motivo: string }) =>
      crearRevision(presupuesto, motivo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: presupuestosKey })
      queryClient.invalidateQueries({ queryKey: presupuestoKey(variables.presupuesto.id) })
    },
  })
}
