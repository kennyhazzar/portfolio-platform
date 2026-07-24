import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/** Exit-preview banner's "Exit preview" link — turns off Draft Mode and returns to the same page. */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
