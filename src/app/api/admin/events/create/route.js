export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const body = await req.json();

    const event = await prisma.events.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date), // important
        time: body.time || null,
        location: body.location || null,
        images: body.images || [], // must be array
        registration_deadline: body.registration_deadline
          ? new Date(body.registration_deadline)
          : null,
        created_by: user.id, // 🔥 from JWT
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