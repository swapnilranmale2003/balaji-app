"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/utils";
import { tripSchema, type ActionResult } from "@/lib/validations";

/** Refreshes every route whose numbers depend on the ledger. */
function revalidateLedger() {
  revalidatePath("/");
  revalidatePath("/trips", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/income");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/trips");
}

/** Empty date inputs mean "not set" rather than an invalid date. */
function toDateOrNull(value: string): Date | null {
  return value ? parseDateInputValue(value) : null;
}

/** True when the failure is Prisma's unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createTrip(values: unknown): Promise<ActionResult<null>> {
  await requireAdmin();

  const parsed = tripSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, startDate, endDate } = parsed.data;

  try {
    await prisma.trip.create({
      data: {
        name,
        description,
        startDate: toDateOrNull(startDate),
        endDate: toDateOrNull(endDate),
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "A trip with that name already exists.",
        fieldErrors: { name: ["A trip with that name already exists."] },
      };
    }

    console.error("createTrip failed", error);
    return { success: false, error: "Could not save the trip. Please try again." };
  }

  revalidateLedger();

  return { success: true, data: null };
}

export async function updateTrip(
  id: string,
  values: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing trip id." };
  }

  const parsed = tripSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, startDate, endDate } = parsed.data;

  try {
    await prisma.trip.update({
      where: { id },
      data: {
        name,
        description,
        startDate: toDateOrNull(startDate),
        endDate: toDateOrNull(endDate),
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        success: false,
        error: "A trip with that name already exists.",
        fieldErrors: { name: ["A trip with that name already exists."] },
      };
    }

    console.error("updateTrip failed", error);
    return {
      success: false,
      error: "Could not update the trip. It may have been deleted.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}

/**
 * Deletes the trip only. Its expenses survive with `tripId` cleared
 * (`onDelete: SetNull`) — the money was still spent, so removing the rows
 * would silently change the team's totals.
 */
export async function deleteTrip(id: string): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing trip id." };
  }

  try {
    await prisma.trip.delete({ where: { id } });
  } catch (error) {
    console.error("deleteTrip failed", error);
    return {
      success: false,
      error: "Could not delete the trip. It may have been deleted already.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}
