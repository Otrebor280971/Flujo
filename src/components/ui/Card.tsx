import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  highlight?: boolean;
}

export default function Card({
  children,
  className = '',
  elevated = false,
  highlight = false,
}: Props) {
  const variant = highlight
    ? 'card-highlight'
    : elevated
      ? 'card-elevated'
      : 'card';

  return (
    <div className={`${variant} ${className}`}>
      {children}
    </div>
  );
}