import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats a number as Indian Rupees, e.g. 10000 -> "₹10,000". */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date as "26 Jul 2026". */
export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

/**
 * Formats a date as `yyyy-MM-dd` for `<input type="date">`.
 * Uses UTC parts because dates are stored at UTC midnight.
 */
export function toDateInputValue(date: Date | string): string {
  const d = new Date(date);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}-${day}`;
}

/**
 * Parses a `yyyy-MM-dd` string into a Date at UTC midnight, so a date never
 * shifts by a day when the server and viewer are in different time zones.
 */
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Formats a date as "Jul 2026", used for monthly grouping. */
export function formatMonthLabel(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

/** Sortable `yyyy-MM` key for grouping records by month. */
export function monthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Escapes a value for CSV: wraps it in quotes and doubles any inner quotes.
 * The leading apostrophe on formula-like values stops spreadsheet programs
 * from executing them (CSV injection).
 */
function escapeCsvCell(value: string | number): string {
  const raw = String(value ?? "");
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Builds a CSV document from a header row and data rows. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

/** Triggers a client-side download of the given text as a file. */
export function downloadCsv(filename: string, csv: string): void {
  // The BOM makes Excel read the file as UTF-8, so "₹" renders correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
