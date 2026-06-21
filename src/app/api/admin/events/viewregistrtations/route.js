import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { checkAndRevokeExpiredAccess } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    // Run lazy revocation check to clean up expired drive accesses
    await checkAndRevokeExpiredAccess();

    const data = await prisma.registrations.findMany({
      include: {
        user: true,
        event: true,
      },
    });

    return Response.json(data);
  } catch (err) {
    return Response.json(
      { message: err.message },
      { status: 403 }
    );
  }
}