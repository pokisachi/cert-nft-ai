import React from 'react';
export function Alert({
  children,
  variant = 'default',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }) {
  const styles =
    variant === 'destructive'
      ? 'border-red-400 bg-red-50 text-red-800'
      : 'border-gray-300 bg-gray-50 text-gray-800';
  return (
    <div className={`rounded-md border p-3 ${styles} ${className}`} {...props}>
      {children}
    </div>
  );
}
export function AlertTitle({ children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className="font-semibold">{children}</p>;
}
export function AlertDescription({ children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className="text-sm">{children}</p>;
}
