import i18n from './index';

export type AccountType =
  | 'debit'
  | 'cash'
  | 'credit'
  | 'investment';

export type MovementCategory =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'adjustment';

export interface CreditCardConfig {
  limit?: number;
  payment_day?: number;
  cutoff_day?: number;
  annual_interest_rate?: number;
  minimum_payment_percent?: number;
}

export interface InvestmentAccountConfig {
  annual_yield?: number;
  monthly_goal?: number;
}

export interface UserAccount {
  id: string;
  name: string;
  type: AccountType;
  color?: string;
  creditConfig?: CreditCardConfig;
  investmentConfig?: InvestmentAccountConfig;
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

export type Currency =
  | 'MXN'
  | 'USD'
  | 'EUR';

export interface AppConfig {
  id: string;
  investment_annual_yield: number;
  investment_monthly_goal: number;
  debit_max_balance: number;
  recurring: RecurringItem[];
  currency: Currency;
  userAccounts: UserAccount[];
}

const DB_NAME = 'flujo_db';
const DB_VERSION = 5;

function openDB(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      const request = indexedDB.open(
        DB_NAME,
        DB_VERSION
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        if (
          !db.objectStoreNames.contains(
            'movements'
          )
        ) {
          db.createObjectStore(
            'movements',
            {
              keyPath: 'id',
            }
          );
        }

        if (
          !db.objectStoreNames.contains(
            'config'
          )
        ) {
          db.createObjectStore(
            'config',
            {
              keyPath: 'id',
            }
          );
        }
      };

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

function tx(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode
) {
  return db
    .transaction(store, mode)
    .objectStore(store);
}

function promisify<T>(
  request: IDBRequest<T>
): Promise<T> {
  return new Promise(
    (resolve, reject) => {
      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

export const DEFAULT_CONFIG: AppConfig = {
  id: 'main',

  currency: 'MXN',

  investment_annual_yield: 0,

  investment_monthly_goal: 0,

  debit_max_balance: 0,

  recurring: [],

  userAccounts: [],
};

export async function getConfig(): Promise<AppConfig> {
  const db = await openDB();

  const result =
    await promisify<
      AppConfig | undefined
    >(
      tx(
        db,
        'config',
        'readonly'
      ).get('main')
    );

  db.close();

  if (!result) {
    return {
      ...DEFAULT_CONFIG,

      recurring: [
        ...DEFAULT_CONFIG.recurring,
      ],

      userAccounts:
        DEFAULT_CONFIG.userAccounts.map(
          (a) => ({ ...a })
        ),
    };
  }

  const merged: AppConfig = {
    ...DEFAULT_CONFIG,

    ...result,

    id: 'main',

    investment_monthly_goal:
      result.investment_monthly_goal ??
      0,

    debit_max_balance:
      result.debit_max_balance ?? 0,

    recurring: Array.isArray(
      result.recurring
    )
      ? result.recurring
      : [...DEFAULT_CONFIG.recurring],

    userAccounts:
      Array.isArray(
        result.userAccounts
      ) &&
      result.userAccounts.length > 0
        ? result.userAccounts.map(
            (acc) => ({
              ...acc,

              creditConfig:
                acc.type === 'credit'
                  ? {
                      limit:
                        acc.creditConfig
                          ?.limit ??
                        (acc as any)
                          .card_limit ??
                        undefined,

                      payment_day:
                        acc.creditConfig
                          ?.payment_day ??
                        (acc as any)
                          .card_payment_day ??
                        undefined,

                      cutoff_day:
                        acc.creditConfig
                          ?.cutoff_day ??
                        (acc as any)
                          .card_cutoff_day ??
                        undefined,

                      annual_interest_rate:
                        acc.creditConfig
                          ?.annual_interest_rate ??
                        (acc as any)
                          .card_annual_interest_rate ??
                        undefined,

                      minimum_payment_percent:
                        acc.creditConfig
                          ?.minimum_payment_percent ??
                        (acc as any)
                          .card_minimum_payment_percent ??
                        undefined,
                    }
                  : undefined,

              investmentConfig:
                acc.type === 'investment'
                  ? {
                      annual_yield:
                        acc.investmentConfig
                          ?.annual_yield ??
                        (acc as any)
                          .investment_annual_yield ??
                        undefined,

                      monthly_goal:
                        acc.investmentConfig
                          ?.monthly_goal ??
                        (acc as any)
                          .investment_monthly_goal ??
                        undefined,
                    }
                  : undefined,
            })
          )
        : DEFAULT_CONFIG.userAccounts.map(
            (a) => ({ ...a })
          ),
  };

  return merged;
}

export async function saveConfig(
  config: AppConfig
): Promise<void> {
  const db = await openDB();

  await promisify(
    tx(
      db,
      'config',
      'readwrite'
    ).put({
      ...config,
      id: 'main',
    })
  );

  db.close();
}

export async function getMovements(): Promise<
  Movement[]
> {
  const db = await openDB();

  const result =
    await promisify<Movement[]>(
      tx(
        db,
        'movements',
        'readonly'
      ).getAll()
    );

  db.close();

  return result.sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );
}

export async function addMovement(
  movement: Omit<
    Movement,
    'id' | 'created_at'
  >
): Promise<Movement> {
  const db = await openDB();

  const full: Movement = {
    ...movement,

    amount: Number(
      movement.amount
    ),

    id: crypto.randomUUID(),

    created_at:
      new Date().toISOString(),
  };

  await promisify(
    tx(
      db,
      'movements',
      'readwrite'
    ).put(full)
  );

  db.close();

  return full;
}

export async function deleteMovement(
  id: string
): Promise<void> {
  const db = await openDB();

  await promisify(
    tx(
      db,
      'movements',
      'readwrite'
    ).delete(id)
  );

  db.close();
}

export async function adjustAccount(
  accountId: string,
  adjustment: number,
  note: string = i18n.t(
    'adjustAccounts.title'
  )
): Promise<Movement> {
  const today = new Date();

  const localDate = new Date(
    today.getTime() -
      today.getTimezoneOffset() *
        60000
  )
    .toISOString()
    .split('T')[0];

  return addMovement({
    category: 'adjustment',

    account: accountId,

    amount: Number(adjustment),

    note,

    date: localDate,
  });
}
