"use server";

import { revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { LEDGER_TAG } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/utils";
import { expenseSchema, type ActionResult } from "@/lib/validations";

/** Invalidates every cached read that depends on the ledger. */
function revalidateLedger() {
  revalidateTag(LEDGER_TAG);
}

export async function createExpense(
  values: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();

  const parsed = expenseSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, description, category, amount, date, tripId } = parsed.data;

  try {
    await prisma.expense.create({
      data: {
        title,
        description,
        category,
        amount,
        date: parseDateInputValue(date),
        tripId,
      },
    });
  } catch {
    return { success: false, error: "Could not save the expense. Please try again." };
  }

  revalidateLedger();

  return { success: true, data: null };
}

export async function updateExpense(
  id: string,
  values: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing expense id." };
  }

  const parsed = expenseSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { title, description, category, amount, date, tripId } = parsed.data;

  try {
    await prisma.expense.update({
      where: { id },
      data: {
        title,
        description,
        category,
        amount,
        date: parseDateInputValue(date),
        tripId,
      },
    });
  } catch {
    return {
      success: false,
      error: "Could not update the expense. It may have been deleted.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}

export async function deleteExpense(id: string): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing expense id." };
  }

  try {
    await prisma.expense.delete({ where: { id } });
  } catch {
    return {
      success: false,
      error: "Could not delete the expense. It may have been deleted already.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}
