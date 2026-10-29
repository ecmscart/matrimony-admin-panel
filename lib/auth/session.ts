import "server-only";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { redirect } from "next/navigation";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export interface SessionUser {
  sub: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return decodeJwt(token) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  if (u.role !== "admin") redirect("/login");
  return u;
}
