import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_tok";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const pw = process.env.ADMIN_PASSWORD ?? "";
  const tok = req.cookies.get(COOKIE)?.value;
  if (!pw || tok !== pw) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
