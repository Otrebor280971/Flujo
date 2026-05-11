export type AccountType = 'debit' | 'cash' | 'credit' | 'investment';

export type MovementCategory = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface UserAccount {
  id: string;
  name: string;
  type: AccountType;
  color?: string;
}

export interface Movement {
  id: string;
  category: MovementCategory;
  account: string;
  destination?: string;
  amount: number;
  note: string;
  date: string;
  created_at: string;
}

export interface RecurringItem {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  label: string;
  amount: number;
  day: number;
  account: string;
  destination?: string;
}

export type Currency = 'MXN' | 'USD' | 'EUR';

export interface AppConfig {
  id: string;
  card_limit: number;
  card_payment_day: number;
  card_cutoff_day: number;
  investment_annual_yield: number;
  recurring: RecurringItem[];
  currency: Currency;
  userAccounts: UserAccount[];
}

const DB_NAME = 'flujo_db';
const DB_VERSION = 4;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('movements')) {
        db.createObjectStore('movements', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  return db.transaction(store, mode).objectStore(store);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_CONFIG: AppConfig = {
  id: 'main',
  currency: 'MXN',
  card_limit: 0,
  card_payment_day: 1,
  card_cutoff_day: 15,
  investment_annual_yield: 0,
  recurring: [],
  userAccounts: [
    { id: 'debit', name: 'Débito', type: 'debit', color: '#ef4444' },
    { id: 'cash', name: 'Efectivo', type: 'cash', color: '#10b981' },
    { id: 'credit', name: 'Crédito', type: 'credit', color: '#6366f1' },
    { id: 'investment', name: 'Inversiones', type: 'investment', color: '#f59e0b' }
  ]
};

export async function getConfig(): Promise<AppConfig> {
  const db = await openDB();
  const result = await promisify<AppConfig | undefined>(
    tx(db, 'config', 'readonly').get('main')
  );
  db.close();
  
  const finalResult = result ?? { ...DEFAULT_CONFIG };
  if (!finalResult.userAccounts) {
    finalResult.userAccounts = [...DEFAULT_CONFIG.userAccounts];
  }
  return finalResult;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const db = await openDB();
  await promisify(tx(db, 'config', 'readwrite').put(config));
  db.close();
}

export async function getMovements(): Promise<Movement[]> {
  const db = await openDB();
  const result = await promisify<Movement[]>(
    tx(db, 'movements', 'readonly').getAll()
  );
  db.close();
  return result.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function addMovement(movement: Omit<Movement, 'id' | 'created_at'>): Promise<Movement> {
  const db = await openDB();
  const full: Movement = {
    ...movement,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  await promisify(tx(db, 'movements', 'readwrite').put(full));
  db.close();
  return full;
}

export async function deleteMovement(id: string): Promise<void> {
  const db = await openDB();
  await promisify(tx(db, 'movements', 'readwrite').delete(id));
  db.close();
}

export async function adjustAccount(accountId: string, adjustment: number, note: string = 'Ajuste manual'): Promise<Movement> {
  return addMovement({
    category: 'adjustment',
    account: accountId,
    amount: adjustment,
    note,
    date: new Date().toISOString().split('T')[0],
  });
}