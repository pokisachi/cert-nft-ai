import * as React from 'react';
export function Card({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border bg-white shadow-sm ${className || ''}`}>{children}</div>;
}
export function CardHeader({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b p-4 ${className || ''}`}>{children}</div>;
}
export function CardTitle({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`font-semibold text-lg ${className || ''}`}>{children}</h2>;
}
export function CardContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 ${className || ''}`}>{children}</div>;
}
export function CardFooter({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-t p-4 flex justify-end gap-2 ${className || ''}`}>{children}</div>;
}
