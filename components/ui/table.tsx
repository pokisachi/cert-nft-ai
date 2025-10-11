import * as React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const Table = ({ children, className = '', ...props }: TableProps) => (
  <table className={`min-w-full border text-sm ${className}`} {...props}>
    {children}
  </table>
);

export const TableHeader = ({ children, className = '', ...props }: TableSectionProps) => (
  <thead className={className} {...props}>{children}</thead>
);

export const TableBody = ({ children, className = '', ...props }: TableSectionProps) => (
  <tbody className={className} {...props}>{children}</tbody>
);

export const TableRow = ({ children, className = '', ...props }: TableRowProps) => (
  <tr className={`border-b ${className}`} {...props}>{children}</tr>
);

export const TableHead = ({ children, className = '', ...props }: TableCellProps) => (
  <th className={`px-3 py-2 text-left font-semibold ${className}`} {...props}>{children}</th>
);

export const TableCell = ({ children, className = '', ...props }: TableCellProps) => (
  <td className={`px-3 py-2 ${className}`} {...props}>{children}</td>
);
