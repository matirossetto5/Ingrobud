import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Pago, PagoInput } from '@/types/pago'

const COLLECTION = 'pagos'

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.')
  return db
}

function fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Pago {
  const data = snap.data()
  return {
    id: snap.id,
    presupuestoId: data.presupuestoId ?? '',
    clienteId: data.clienteId ?? '',
    clienteNombre: data.clienteNombre ?? '',
    fecha: data.fecha ?? '',
    monto: data.monto ?? 0,
    // Pagos anteriores a las etapas/CAC: en pesos, sin actualización, cancelan su monto nominal.
    moneda: data.moneda ?? 'ARS',
    etapaId: data.etapaId ?? '',
    montoBase: data.montoBase ?? data.monto ?? 0,
    mesIndice: data.mesIndice ?? '',
    coeficiente: data.coeficiente ?? 1,
    metodo: data.metodo ?? 'otro',
    notas: data.notas ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? 0,
  }
}

export async function getPagos(): Promise<Pago[]> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), orderBy('fecha', 'desc')))
  return snap.docs.map(fromDoc)
}

export async function createPago(input: PagoInput): Promise<void> {
  await addDoc(collection(requireDb(), COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function deletePago(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
