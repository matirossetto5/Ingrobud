import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPresupuesto,
  deletePresupuesto,
  getPresupuesto,
  getPresupuestos,
  updatePresupuesto,
} from '@/lib/presupuestos'
import type { PresupuestoInput } from '@/types/presupuesto'

const presupuestosKey = ['presupuestos'] as const
const presupuestoKey = (id: string) => ['presupuestos', id] as const

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
