import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Cliente, ClienteInput } from '@/types/cliente'

const COLLECTION = 'clientes'

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.')
  return db
}

function fromDoc(snap: DocumentSnapshot<DocumentData>): Cliente {
  const data = snap.data()
  if (!data) throw new Error('El cliente no existe.')
  return {
    id: snap.id,
    nombre: data.nombre ?? '',
    empresa: data.empresa ?? '',
    email: data.email ?? '',
    telefono: data.telefono ?? '',
    direccion: data.direccion ?? '',
    notas: data.notas ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? 0,
  }
}

export async function getClientes(): Promise<Cliente[]> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), orderBy('nombre')))
  return snap.docs.map(fromDoc)
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, id))
  return snap.exists() ? fromDoc(snap) : null
}

export async function createCliente(input: ClienteInput): Promise<void> {
  await addDoc(collection(requireDb(), COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateCliente(id: string, input: ClienteInput): Promise<void> {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCliente(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
