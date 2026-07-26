"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/utils";
import { incomeSchema, type ActionResult } from "@/lib/validations";

/** Refreshes every route whose numbers depend on the ledger. */
function revalidateLedger() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/income");
  revalidatePath("/admin/expenses");
}

export async function createIncome(values: unknown): Promise<ActionResult<null>> {
  await requireAdmin();

  const parsed = incomeSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, description, date } = parsed.data;

  try {
    await prisma.income.create({
      data: { amount, description, date: parseDateInputValue(date) },
    });
  } catch (error) {
    console.error("createIncome failed", error);
    return { success: false, error: "Could not save the income. Please try again." };
  }

  revalidateLedger();

  return { success: true, data: null };
}

export async function updateIncome(
  id: string,
  values: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing income id." };
  }

  const parsed = incomeSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { amount, description, date } = parsed.data;

  try {
    await prisma.income.update({
      where: { id },
      data: { amount, description, date: parseDateInputValue(date) },
    });
  } catch (error) {
    console.error("updateIncome failed", error);
    return {
      success: false,
      error: "Could not update the income. It may have been deleted.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}

export async function deleteIncome(id: string): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing income id." };
  }

  try {
    await prisma.income.delete({ where: { id } });
  } catch (error) {
    console.error("deleteIncome failed", error);
    return {
      success: false,
      error: "Could not delete the income. It may have been deleted already.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}
