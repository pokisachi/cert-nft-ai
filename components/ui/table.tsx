import * as React from "react";

// ---------- Table Container ----------
export const Table = ({
  children,
  className = "",
  variant = "default",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { variant?: "default" | "dark" }) => (
  <div className="overflow-x-auto">
    <table
      className={`min-w-full text-sm rounded ${
        variant === "dark" ? "border border-[#3b4354] text-white" : "border border-gray-200"
      } ${className}`}
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
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { variant?: "default" | "dark" }) => (
  <thead
    className={`${variant === "dark" ? "bg-[#282d39] border-b border-[#3b4354]" : "bg-gray-100"} ${className}`}
    {...props}
  >
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
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { variant?: "default" | "dark" }) => (
  <tr
    className={`${
      variant === "dark" ? "border-b border-[#3b4354] hover:bg-[#272b33]" : "border-b hover:bg-gray-50"
    } ${className}`}
    {...props}
  >
    {children}
  </tr>
);

// ---------- Header Cell ----------
export const TableHead = ({
  children,
  className = "",
  variant = "default",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { variant?: "default" | "dark" }) => (
  <th
    className={`px-4 py-2 text-left font-semibold ${
      variant === "dark" ? "text-[#9da6b9]" : "text-gray-700"
    } ${className}`}
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
