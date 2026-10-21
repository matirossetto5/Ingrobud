import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Presupuesto, PresupuestoInput, PresupuestoRevision } from '@/types/presupuesto'

const COLLECTION = 'presupuestos'
const REVISIONES = 'revisiones'

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
    moneda: data.moneda ?? 'ARS',
    mesBaseCac: data.mesBaseCac ?? '',
    etapasPago: data.etapasPago ?? [],
    revision: data.revision ?? 0,
    motivoRevision: data.motivoRevision ?? '',
    createdAt: data.createdAt?.toMillis?.() ?? 0,
    updatedAt: data.updatedAt?.toMillis?.() ?? 0,
  }
}

function revisionFromDoc(snap: DocumentSnapshot<DocumentData>): PresupuestoRevision {
  const data = snap.data()
  if (!data) throw new Error('La revisión no existe.')
  return {
    revision: data.revision ?? 0,
    motivoRevision: data.motivoRevision ?? '',
    clienteNombre: data.clienteNombre ?? '',
    fecha: data.fecha ?? '',
    validoHasta: data.validoHasta ?? '',
    estado: data.estado ?? 'borrador',
    secciones: data.secciones ?? [],
    notas: data.notas ?? '',
    moneda: data.moneda ?? 'ARS',
    mesBaseCac: data.mesBaseCac ?? '',
    etapasPago: data.etapasPago ?? [],
    archivadaEn: data.archivadaEn?.toMillis?.() ?? 0,
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
    revision: 0,
    motivoRevision: '',
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

/**
 * Archiva la versión vigente en `revisiones/{n}` y abre la revisión n+1 como borrador,
 * con el mismo contenido para que se pueda editar a partir de ahí.
 */
export async function crearRevision(presupuesto: Presupuesto, motivo: string): Promise<void> {
  const database = requireDb()
  const ref = doc(database, COLLECTION, presupuesto.id)
  const batch = writeBatch(database)
  batch.set(doc(ref, REVISIONES, String(presupuesto.revision)), {
    revision: presupuesto.revision,
    motivoRevision: presupuesto.motivoRevision,
    clienteNombre: presupuesto.clienteNombre,
    fecha: presupuesto.fecha,
    validoHasta: presupuesto.validoHasta,
    estado: presupuesto.estado,
    secciones: presupuesto.secciones,
    notas: presupuesto.notas,
    moneda: presupuesto.moneda,
    mesBaseCac: presupuesto.mesBaseCac,
    etapasPago: presupuesto.etapasPago,
    archivadaEn: serverTimestamp(),
  })
  batch.update(ref, {
    revision: presupuesto.revision + 1,
    motivoRevision: motivo,
    estado: 'borrador',
    fecha: new Date().toISOString().slice(0, 10),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function getRevisiones(presupuestoId: string): Promise<PresupuestoRevision[]> {
  const snap = await getDocs(
    query(collection(requireDb(), COLLECTION, presupuestoId, REVISIONES), orderBy('revision', 'desc')),
  )
  return snap.docs.map(revisionFromDoc)
}

export async function getRevision(presupuestoId: string, revision: number): Promise<PresupuestoRevision | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, presupuestoId, REVISIONES, String(revision)))
  return snap.exists() ? revisionFromDoc(snap) : null
}

export async function deletePresupuesto(id: string): Promise<void> {
  const database = requireDb()
  const revisiones = await getDocs(collection(database, COLLECTION, id, REVISIONES))
  const batch = writeBatch(database)
  revisiones.docs.forEach((r) => batch.delete(r.ref))
  batch.delete(doc(database, COLLECTION, id))
  await batch.commit()
}
