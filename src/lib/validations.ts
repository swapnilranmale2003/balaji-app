import { z } from "zod";

import { CATEGORIES } from "@/lib/constants";

/** `yyyy-MM-dd`, and a real calendar date (rejects 2026-02-31). */
const dateString = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker to choose a valid date")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "That date does not exist");

/** An optional `yyyy-MM-dd`; empty string means "not set". */
const optionalDateString = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Use the date picker to choose a valid date",
  })
  .default("");

const MAX_AMOUNT = 100_000_000;

/**
 * Amounts arrive from `<input type="number">` as strings. Coerce, then bound
 * them so the database never stores NaN, negatives, or unrenderable values.
 */
const amount = z.coerce
  .number({ invalid_type_error: "Amount must be a number" })
  .positive("Amount must be greater than 0")
  .max(MAX_AMOUNT, "Amount must be 10,00,00,000 or less")
  .refine(Number.isFinite, "Amount must be a valid number");

/** A trip may legitimately have collected nothing yet, so zero is allowed. */
const receivedAmount = z.coerce
  .number({ invalid_type_error: "Received amount must be a number" })
  .min(0, "Received amount cannot be negative")
  .max(MAX_AMOUNT, "Received amount must be 10,00,00,000 or less")
  .refine(Number.isFinite, "Received amount must be a valid number")
  .default(0);

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const tripSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Trip name must be at least 2 characters")
      .max(80, "Trip name must be 80 characters or fewer"),
    description: z
      .string()
      .trim()
      .max(300, "Description must be 300 characters or fewer")
      .default(""),
    received: receivedAmount,
    startDate: optionalDateString,
    endDate: optionalDateString,
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: "End date cannot be before the start date", path: ["endDate"] },
  );

/** Editing just the received amount, from the trip detail page. */
export const receivedSchema = z.object({ received: receivedAmount });

export const expenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Expense name must be at least 2 characters")
    .max(100, "Expense name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .default(""),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Choose a category" }),
  }),
  amount,
  date: dateString,
  // Every expense belongs to a trip, so this is required.
  tripId: z.string().trim().min(1, "Choose a trip"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type TripInput = z.infer<typeof tripSchema>;
export type ReceivedInput = z.infer<typeof receivedSchema>;

/** Shape returned by every server action, so forms can handle results uniformly. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
