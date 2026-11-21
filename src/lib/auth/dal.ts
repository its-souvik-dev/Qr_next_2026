import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { validateSession, type SessionUser } from "./session";

/**
 * Data Access Layer entry points. Every page, action and route that touches user data
 * must resolve the user through these helpers — never trust client-supplied ids.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => validateSession());

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
