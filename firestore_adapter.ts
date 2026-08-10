import { db, auth } from "./firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch,
  onSnapshot
} from "firebase/firestore";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to normalize collection names
const getCollName = (table: string): string => {
  const t = table.toLowerCase();
  if (t === 'disposisi') return 'disposisi';
  if (t === 'suratkeluar' || t === 'sk') return 'surat_keluar';
  if (t === 'tembusan') return 'tembusan';
  if (t === 'arsip') return 'arsip';
  if (t === 'logaktivitas' || t === 'logs') return 'logs';
  if (t === 'bidang') return 'bidang';
  if (t === 'pejabat') return 'pejabat';
  if (t === 'kategori') return 'kategori';
  if (t === 'jenissurat') return 'jenis_surat';
  if (t === 'users') return 'users';
  return t;
};

export const fsSave = async (table: string, data: any) => {
  if (!data || !data.id) return;
  const coll = getCollName(table);
  const path = `${coll}/${data.id}`;
  try {
    const docRef = doc(db, coll, String(data.id));
    // Clean undefined fields to avoid firestore errors
    const cleaned = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const fsDelete = async (table: string, id: any) => {
  if (!id) return;
  const coll = getCollName(table);
  const path = `${coll}/${id}`;
  try {
    const docRef = doc(db, coll, String(id));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const fsGetAll = async (table: string) => {
  const coll = getCollName(table);
  try {
    const querySnapshot = await getDocs(collection(db, coll));
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, coll);
    return null;
  }
};

export const fsImportAll = async (allData: { [key: string]: any[] }) => {
  try {
    const batch = writeBatch(db);
    for (const [table, list] of Object.entries(allData)) {
      if (!Array.isArray(list)) continue;
      const coll = getCollName(table);
      list.forEach((item) => {
        if (item && item.id) {
          const docRef = doc(db, coll, String(item.id));
          const cleaned = JSON.parse(JSON.stringify(item));
          batch.set(docRef, cleaned, { merge: true });
        }
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "batch_import");
  }
};

export const fsListenAll = (table: string, callback: (data: any[]) => void) => {
  const coll = getCollName(table);
  return onSnapshot(collection(db, coll), (querySnapshot) => {
    const list: any[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data());
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, coll);
  });
};
