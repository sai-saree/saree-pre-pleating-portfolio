import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function PUT(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const body = await req.json();

    if (!body.id) {
      throw new Error("Event ID is required");
    }

    const event = await prisma.events.update({
      where: {
        id: Number(body.id), // ⚠️ ensure number
      },
      data: {
        ...(body.date && { date: new Date(body.date) }),
        ...(body.time !== undefined && { time: body.time }),
        ...(body.registration_deadline !== undefined && {
          registration_deadline: body.registration_deadline
            ? new Date(body.registration_deadline)
            : null,
        }),
      },
    });

    return Response.json(event);
  } catch (err) {
    return Response.json(
      { message: err.message },
      { status: 403 }
    );
  }
}