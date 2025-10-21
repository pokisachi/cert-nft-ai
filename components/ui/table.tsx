import * as React from "react";

// ---------- Table Container ----------
export const Table = ({
  children,
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-x-auto">
    <table
      className={`min-w-full border border-gray-200 text-sm rounded ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

// ---------- Header Section ----------
export const TableHeader = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-gray-100 ${className}`} {...props}>
    {children}
  </thead>
);

// ---------- Body Section ----------
export const TableBody = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={className} {...props}>
    {children}
  </tbody>
);

// ---------- Row ----------
export const TableRow = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`border-b hover:bg-gray-50 ${className}`} {...props}>
    {children}
  </tr>
);

// ---------- Header Cell ----------
export const TableHead = ({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={`px-4 py-2 text-left font-semibold text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </th>
);

// ---------- Data Cell ----------
export const TableCell = ({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-4 py-2 ${className}`} {...props}>
    {children}
  </td>
);
