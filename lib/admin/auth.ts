import { cookies } from "next/headers";

const COOKIE = "admin_tok";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const pw = getAdminPassword();
  if (!pw) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === pw;
}

export async function setAdminCookie(password: string): Promise<boolean> {
  const pw = getAdminPassword();
  if (!pw || password !== pw) return false;
  const jar = await cookies();
  jar.set(COOKIE, pw, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return true;
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
