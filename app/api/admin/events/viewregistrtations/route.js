import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const data = await prisma.registrations.findMany({
      include: {
        users: true,
        events: true,
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