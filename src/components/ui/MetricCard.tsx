import type { ElementType } from 'react';
import type { Currency } from '../../lib/db';

import Card from './Card';
import { formatMoney } from '../Format';

interface Props {
  label: string;
  value: number;
  currency: Currency;
  icon: ElementType;
  color?: string;
  negative?: boolean;
}

export default function MetricCard({
  label,
  value,
  currency,
  icon: Icon,
  color = 'text-zinc-100',
  negative = false,
}: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-zinc-500 truncate">
            {label}
          </p>

          <p className={`text-lg font-semibold tracking-tight ${color}`}>
            {negative ? '-' : ''}
            {formatMoney(value, currency)}
          </p>
        </div>

        <div className="shrink-0">
          <Icon
            size={16}
            className={`opacity-80 ${color}`}
          />
        </div>
      </div>
    </Card>
  );
}