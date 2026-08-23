import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCliente, deleteCliente, getClientes, updateCliente } from '@/lib/clientes'
import type { ClienteInput } from '@/types/cliente'

const clientesKey = ['clientes'] as const

export function useClientes() {
  return useQuery({ queryKey: clientesKey, queryFn: getClientes })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ClienteInput) => createCliente(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientesKey }),
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClienteInput }) => updateCliente(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientesKey }),
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCliente(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientesKey }),
  })
}
