import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { IndiceCac } from '@/types/indiceCac'

const COLLECTION = 'indicesCac'

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.')
  return db
}

/** Ordenados del más reciente al más antiguo. */
export async function getIndicesCac(): Promise<IndiceCac[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTION))
  return snap.docs
    .map((d) => ({ mes: d.id, valor: (d.data().valor as number) ?? 0 }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
}

export async function saveIndiceCac(indice: IndiceCac): Promise<void> {
  await setDoc(doc(requireDb(), COLLECTION, indice.mes), { valor: indice.valor })
}

export async function deleteIndiceCac(mes: string): Promise<void> {
  await deleteDoc(doc(requireDb(), COLLECTION, mes))
}

export interface Actualizacion {
  coeficiente: number
  indiceBase: number
  indiceAplicado: number
}

/**
 * Coeficiente de actualización entre el mes base y el mes aplicado. Nunca es menor que 1: si el
 * índice aplicado no supera al base, se mantiene el valor base. Devuelve null si falta algún índice.
 */
export function calcularActualizacion(
  indices: IndiceCac[],
  mesBase: string,
  mesAplicado: string,
): Actualizacion | null {
  const indiceBase = indices.find((i) => i.mes === mesBase)?.valor
  if (!indiceBase) return null
  const indiceAplicado = indices.find((i) => i.mes === mesAplicado)?.valor
  if (!indiceAplicado) return null
  return { coeficiente: Math.max(1, indiceAplicado / indiceBase), indiceBase, indiceAplicado }
}
