import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) {
      return Response.json({ user: null }, { status: 200 });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({ user });
  } catch (err) {
    return Response.json({ user: null }, { status: 200 });
  }
}
