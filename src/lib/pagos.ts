import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
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
    indiceBase: data.indiceBase ?? 0,
    indiceAplicado: data.indiceAplicado ?? 0,
    numeroRecibo: data.numeroRecibo ?? 0,
    metodo: data.metodo ?? 'otro',
    notas: data.notas ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? 0,
  }
}

export async function getPagos(): Promise<Pago[]> {
  const snap = await getDocs(query(collection(requireDb(), COLLECTION), orderBy('fecha', 'desc')))
  return snap.docs.map(fromDoc)
}

const RECIBOS_COUNTER = ['counters', 'recibos'] as const

/** Registra el pago y le asigna el próximo número de recibo en la misma transacción. */
export async function createPago(input: PagoInput): Promise<Pago> {
  const database = requireDb()
  const counterRef = doc(database, ...RECIBOS_COUNTER)
  const ref = doc(collection(database, COLLECTION))
  const numeroRecibo = await runTransaction(database, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = (snap.exists() ? (snap.data().value as number) : 0) + 1
    tx.set(counterRef, { value: next }, { merge: true })
    tx.set(ref, { ...input, numeroRecibo: next, createdAt: serverTimestamp() })
    return next
  })
  return { ...input, id: ref.id, numeroRecibo, createdAt: Date.now() }
}

/** Para pagos registrados antes de los recibos: asigna número la primera vez que se emite. */
export async function asignarNumeroRecibo(pagoId: string): Promise<number> {
  const database = requireDb()
  const counterRef = doc(database, ...RECIBOS_COUNTER)
  const pagoRef = doc(database, COLLECTION, pagoId)
  return runTransaction(database, async (tx) => {
    const pagoSnap = await tx.get(pagoRef)
    const existente = pagoSnap.data()?.numeroRecibo as number | undefined
    if (existente) return existente
    const snap = await tx.get(counterRef)
    const next = (snap.exists() ? (snap.data().value as number) : 0) + 1
    tx.set(counterRef, { value: next }, { merge: true })
    tx.update(pagoRef, { numeroRecibo: next })
    return next
  })
}

export async function deletePago(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, id))
}
