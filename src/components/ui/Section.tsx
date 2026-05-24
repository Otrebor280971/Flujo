import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({
  title,
  children,
  className = '',
}: Props) {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && (
        <div className="px-1">
          <h2 className="section-title">
            {title}
          </h2>
        </div>
      )}

      {children}
    </section>
  );
}