import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
  error?: Error | null;
  loading?: boolean;
};

export function CapabilityCard({ title, description, children, error, loading }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
        {error && <p role="alert">Unable to load {title.toLowerCase()}: {error.message}</p>}
        {!loading && !error && children}
      </div>
    </section>
  );
}
