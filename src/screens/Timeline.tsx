import { formatMoney } from '../components/Format';

import type {
  Movement,
  Currency,
  UserAccount,
} from '../lib/db';

import Card from '../components/ui/Card';
import Section from '../components/ui/Section';

import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  events: Movement[];
  currency: Currency;
  accounts: UserAccount[];
  onEdit: (event: Movement) => void;
}

export default function Timeline({
  events,
  currency,
  accounts,
  onEdit,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <span className="text-5xl mb-5">
          📭
        </span>

        <p className="text-sm">
          No hay movimientos registrados
        </p>
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(
        b.date + 'T12:00:00'
      ).getTime() -
      new Date(
        a.date + 'T12:00:00'
      ).getTime()
  );

  const grouped: Record<
    string,
    Movement[]
  > = {};

  for (const event of sortedEvents) {
    const key = event.date;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(event);
  }

  const dateKeys = Object.keys(
    grouped
  ).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="space-y-6">
      {dateKeys.map((dateKey) => {
        const dayMovements =
          grouped[dateKey];

        const dateObj = new Date(
          dateKey + 'T12:00:00'
        );

        const dateLabel =
          dateObj.toLocaleDateString(
            'es-MX',
            {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }
          );

        const dayTotal =
          dayMovements.reduce(
            (sum, m) => {
              if (
                m.category ===
                  'income' ||
                m.category ===
                  'adjustment'
              ) {
                return (
                  sum + m.amount
                );
              }

              if (
                m.category ===
                'expense'
              ) {
                return (
                  sum - m.amount
                );
              }

              return sum;
            },
            0
          );

        return (
          <Section
            key={dateKey}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium capitalize text-zinc-500">
                {dateLabel}
              </span>

              <span
                className={`text-xs font-medium ${
                  dayTotal > 0
                    ? 'text-emerald-300'
                    : dayTotal < 0
                      ? 'text-red-400'
                      : 'text-zinc-500'
                }`}
              >
                {dayTotal > 0
                  ? '+'
                  : ''}
                {formatMoney(
                  dayTotal,
                  currency
                )}
              </span>
            </div>

            <div className="space-y-2">
              {dayMovements.map(
                (event) => {
                  const isIncome =
                    event.category ===
                    'income';

                  const isTransfer =
                    event.category ===
                    'transfer';

                  const isAdjustment =
                    event.category ===
                    'adjustment';

                  let Icon =
                    ArrowDownRight;

                  let iconColor =
                    'text-red-400';

                  let bgIcon =
                    'bg-red-500/10';

                  let amountPrefix =
                    '-';

                  let amountColor =
                    'text-zinc-100';

                  if (isIncome) {
                    Icon =
                      ArrowUpRight;

                    iconColor =
                      'text-emerald-300';

                    bgIcon =
                      'bg-emerald-500/10';

                    amountPrefix =
                      '+';

                    amountColor =
                      'text-emerald-300';
                  } else if (
                    isTransfer
                  ) {
                    Icon =
                      ArrowRightLeft;

                    iconColor =
                      'text-cyan-300';

                    bgIcon =
                      'bg-cyan-500/10';

                    amountPrefix =
                      '';

                    amountColor =
                      'text-cyan-300';
                  } else if (
                    isAdjustment
                  ) {
                    Icon =
                      SlidersHorizontal;

                    iconColor =
                      'text-zinc-400';

                    bgIcon =
                      'bg-zinc-500/10';

                    amountPrefix =
                      event.amount >=
                      0
                        ? '+'
                        : '';

                    amountColor =
                      event.amount >=
                      0
                        ? 'text-emerald-300'
                        : 'text-red-400';
                  }

                  const accountName =
                    accounts.find(
                      (a) =>
                        a.id ===
                        event.account
                    )?.name ||
                    'Cuenta eliminada';

                  const destName =
                    isTransfer &&
                    event.destination
                      ? accounts.find(
                          (a) =>
                            a.id ===
                            event.destination
                        )?.name ||
                        'Cuenta eliminada'
                      : null;

                  return (
                    <Card
                      key={event.id}
                      className="
                        p-4
                        cursor-pointer
                        active:scale-[0.985]
                        transition-transform
                      "
                    >
                      <button
                        onClick={() =>
                          onEdit(event)
                        }
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`
                              p-2.5
                              rounded-xl
                              shrink-0
                              ${bgIcon}
                            `}
                          >
                            <Icon
                              size={17}
                              className={
                                iconColor
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-100 truncate">
                              {event.note ||
                                'Sin nota'}
                            </p>

                            <p className="text-xs text-zinc-500 mt-1 truncate">
                              {
                                accountName
                              }

                              {destName
                                ? ` → ${destName}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <p
                            className={`text-sm font-semibold ${amountColor}`}
                          >
                            {
                              amountPrefix
                            }

                            {formatMoney(
                              event.amount,
                              currency
                            )}
                          </p>
                        </div>
                      </button>
                    </Card>
                  );
                }
              )}
            </div>
          </Section>
        );
      })}
    </div>
  );
}