export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");

    return Response.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
