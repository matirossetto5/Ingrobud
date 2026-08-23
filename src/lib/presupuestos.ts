import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Presupuesto, PresupuestoInput } from '@/types/presupuesto'

const COLLECTION = 'presupuestos'

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.')
  return db
}

function fromDoc(snap: DocumentSnapshot<DocumentData>): Presupuesto {
  const data = snap.data()
  if (!data) throw new Error('El presupuesto no existe.')
  return {
    id: snap.id,
    numero: data.numero ?? 0,
    clienteId: data.clienteId ?? '',
    clienteNombre: data.clienteNombre ?? '',
    fecha: data.fecha ?? '',
    validoHasta: data.validoHasta ?? '',
    estado: data.estado ?? 'borrador',
    secciones: data.secciones ?? [],
    notas: data.notas ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? 0,
  }
}

async function getNextNumero(): Promise<number> {
  const database = requireDb()
  const counterRef = doc(database, 'counters', 'presupuestos')
  return runTransaction(database, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = (snap.exists() ? (snap.data().value as number) : 0) + 1
    tx.set(counterRef, { value: next }, { merge: true })
    return next
  })
}

export async function getPresupuestos(): Promise<Presupuesto[]> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), orderBy('numero', 'desc')))
  return snap.docs.map(fromDoc)
}

export async function getPresupuesto(id: string): Promise<Presupuesto | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, id))
  return snap.exists() ? fromDoc(snap) : null
}

export async function createPresupuesto(input: PresupuestoInput): Promise<string> {
  const database = requireDb()
  const numero = await getNextNumero()
  const ref = await addDoc(collection(database, COLLECTION), {
    ...input,
    numero,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePresupuesto(id: string, input: PresupuestoInput): Promise<void> {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePresupuesto(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
