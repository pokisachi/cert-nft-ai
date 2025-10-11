'use client';
import Link from 'next/link';

export default function EmptyState({
  title,
  ctaLabel,
  ctaHref,
  description,
}: {
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div aria-hidden className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">🗂️</div>
      <p className="text-sm text-gray-600">{title}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-2 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
