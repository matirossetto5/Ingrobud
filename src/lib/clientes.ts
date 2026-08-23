import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Cliente, ClienteInput } from '@/types/cliente'

const COLLECTION = 'clientes'

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.')
  return db
}

function fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Cliente {
  const data = snap.data()
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
