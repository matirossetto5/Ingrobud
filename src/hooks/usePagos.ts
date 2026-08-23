import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPago, deletePago, getPagos } from '@/lib/pagos'
import type { PagoInput } from '@/types/pago'

const pagosKey = ['pagos'] as const

export function usePagos() {
  return useQuery({ queryKey: pagosKey, queryFn: getPagos })
}

export function useCreatePago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PagoInput) => createPago(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagosKey }),
  })
}

export function useDeletePago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePago(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagosKey }),
  })
}
