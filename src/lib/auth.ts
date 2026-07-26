import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "balaji_session";

/** Session lifetime: 7 days. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  username: string;
  role: "admin";
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a value of at least 32 characters in your .env file.",
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Compares two strings in constant time so that a network observer cannot learn
 * the expected value from how long the comparison takes.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  // Fold the length difference into the result rather than returning early.
  let mismatch = aBytes.length ^ bBytes.length;
  const max = Math.max(aBytes.length, bBytes.length);

  for (let i = 0; i < max; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return mismatch === 0;
}

/** Validates a username/password pair against the single configured admin account. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set in your .env file.",
    );
  }

  // Both comparisons always run so the response time does not reveal which
  // of the two fields was wrong.
  const usernameOk = timingSafeEqual(username, expectedUsername);
  const passwordOk = timingSafeEqual(password, expectedPassword);

  return usernameOk && passwordOk;
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function decodeSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin" || typeof payload.username !== "string") {
      return null;
    }

    return { username: payload.username, role: "admin" };
  } catch {
    // Invalid signature, expired token, or malformed JWT.
    return null;
  }
}

/** Issues a signed session cookie for the admin. */
export async function createSession(username: string): Promise<void> {
  const token = await encodeSession({ username, role: "admin" });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns the current session, or null when the visitor is not signed in. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Guards admin-only server code. Redirects to the login page when there is no
 * valid session, so every admin page and server action can call this first.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
