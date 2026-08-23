export interface Cliente {
  id: string
  nombre: string
  empresa: string
  email: string
  telefono: string
  direccion: string
  notas: string
  createdAt: number
  updatedAt: number
}

export type ClienteInput = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>

export const emptyClienteInput: ClienteInput = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  direccion: '',
  notas: '',
}
