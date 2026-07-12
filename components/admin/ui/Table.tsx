import type { ReactNode } from "react";

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50/50">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left text-xs font-semibold tracking-wide text-slate-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
  );
}

export function TableRow({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? "cursor-pointer hover:bg-primary-light/40" : "hover:bg-slate-50/60"} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-5 py-4 text-slate-700 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 animate-pulse rounded-md bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TableEmpty({
  colSpan,
  message = "No results found",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="text-sm text-slate-400">{message}</p>
      </td>
    </tr>
  );
}
