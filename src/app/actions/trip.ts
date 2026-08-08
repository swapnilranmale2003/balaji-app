"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/utils";
import {
  receivedSchema,
  tripSchema,
  type ActionResult,
} from "@/lib/validations";

/** Refreshes every route whose numbers depend on the ledger. */
function revalidateLedger() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
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

  const { name, description, received, startDate, endDate } = parsed.data;

  try {
    await prisma.trip.create({
      data: {
        name,
        description,
        received,
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

  const { name, description, received, startDate, endDate } = parsed.data;

  try {
    await prisma.trip.update({
      where: { id },
      data: {
        name,
        description,
        received,
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
 * Deletes the trip and, by cascade, every expense recorded against it. The trip
 * is the unit of accounting, so its expenses have no meaning without it.
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

/** Updates just the received amount, from the trip detail page. */
export async function updateTripReceived(
  id: string,
  values: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: "Missing trip id." };
  }

  const parsed = receivedSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.trip.update({
      where: { id },
      data: { received: parsed.data.received },
    });
  } catch (error) {
    console.error("updateTripReceived failed", error);
    return {
      success: false,
      error: "Could not update the received amount. Please try again.",
    };
  }

  revalidateLedger();

  return { success: true, data: null };
}
