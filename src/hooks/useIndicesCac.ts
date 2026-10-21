import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteIndiceCac, getIndicesCac, saveIndiceCac } from '@/lib/indicesCac'
import type { IndiceCac } from '@/types/indiceCac'

const indicesKey = ['indicesCac'] as const

export function useIndicesCac() {
  return useQuery({ queryKey: indicesKey, queryFn: getIndicesCac })
}

export function useSaveIndiceCac() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (indice: IndiceCac) => saveIndiceCac(indice),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indicesKey }),
  })
}

export function useDeleteIndiceCac() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mes: string) => deleteIndiceCac(mes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: indicesKey }),
  })
}
