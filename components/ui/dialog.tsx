import React, { useState } from 'react';

export function Dialog({ open, onOpenChange, children }: any) {
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{children}</div>
  ) : null;
}
export const DialogTrigger = ({ asChild, children }: any) => {
  const [open, setOpen] = useState(false);
  return React.cloneElement(children, {
    onClick: () => setOpen(true),
  });
};
export const DialogContent = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>{children}</div>
);
export const DialogHeader = ({ children }: any) => <div className="border-b mb-2 pb-2">{children}</div>;
export const DialogTitle = ({ children }: any) => <h2 className="font-semibold text-lg">{children}</h2>;
