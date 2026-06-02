import { getAdminDb } from "./firebase-admin";

type QueryLike = FirebaseFirestore.Query;
type CollectionLike = FirebaseFirestore.CollectionReference;
type DocumentLike = FirebaseFirestore.DocumentReference;
type QueryConstraint = (ref: QueryLike) => QueryLike;

interface WrappedDocumentSnapshot {
  _raw: FirebaseFirestore.DocumentSnapshot;
  id: string;
  exists: () => boolean;
  data: () => FirebaseFirestore.DocumentData;
}

function wrapDocumentSnapshot(snapshot: FirebaseFirestore.DocumentSnapshot): WrappedDocumentSnapshot {
  return {
    _raw: snapshot,
    id: snapshot.id,
    exists: () => snapshot.exists,
    data: () => snapshot.data() ?? {},
  };
}

function wrapQuerySnapshot(snapshot: FirebaseFirestore.QuerySnapshot) {
  return {
    docs: snapshot.docs.map(wrapDocumentSnapshot),
    size: snapshot.size,
    empty: snapshot.empty,
  };
}

export const db = getAdminDb();

export function collection(parent: FirebaseFirestore.Firestore | DocumentLike, path: string): CollectionLike {
  return parent.collection(path);
}

export function doc(parent: FirebaseFirestore.Firestore | CollectionLike, path: string, id?: string): DocumentLike {
  if ("collection" in parent) {
    if (!id) return parent.doc(path);
    return parent.collection(path).doc(id);
  }
  return parent.doc(path);
}

export async function getDoc(ref: DocumentLike): Promise<WrappedDocumentSnapshot> {
  return wrapDocumentSnapshot(await ref.get());
}

export async function getDocs(ref: QueryLike) {
  return wrapQuerySnapshot(await ref.get());
}

export async function setDoc(ref: DocumentLike, data: FirebaseFirestore.DocumentData, options?: { merge?: boolean }) {
  return options ? ref.set(data, options) : ref.set(data);
}

export async function updateDoc(ref: DocumentLike, data: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>) {
  return ref.update(data);
}

export async function addDoc(ref: CollectionLike, data: FirebaseFirestore.DocumentData) {
  return ref.add(data);
}

export async function deleteDoc(ref: DocumentLike) {
  return ref.delete();
}

export function query(ref: QueryLike, ...constraints: QueryConstraint[]) {
  return constraints.reduce((current, constraint) => constraint(current), ref);
}

export function where(field: string, operator: FirebaseFirestore.WhereFilterOp, value: unknown): QueryConstraint {
  return (ref) => ref.where(field, operator, value);
}

export function orderBy(field: string, direction: FirebaseFirestore.OrderByDirection = "asc"): QueryConstraint {
  return (ref) => ref.orderBy(field, direction);
}

export function limit(count: number): QueryConstraint {
  return (ref) => ref.limit(count);
}

export function startAfter(snapshot: WrappedDocumentSnapshot): QueryConstraint {
  return (ref) => ref.startAfter(snapshot._raw);
}

export async function getCountFromServer(ref: QueryLike) {
  const snapshot = await ref.count().get();
  return { data: () => ({ count: snapshot.data().count }) };
}
