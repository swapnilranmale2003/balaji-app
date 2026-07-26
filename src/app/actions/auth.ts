"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  verifyCredentials,
} from "@/lib/auth";
import { loginSchema, type ActionResult } from "@/lib/validations";

export async function loginAction(
  values: unknown,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      error: "Please check the form and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, password } = parsed.data;

  if (!verifyCredentials(username, password)) {
    // Deliberately vague: naming the wrong field would let someone enumerate
    // valid usernames.
    return { success: false, error: "Invalid username or password." };
  }

  await createSession(username);

  return { success: true, data: null };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
