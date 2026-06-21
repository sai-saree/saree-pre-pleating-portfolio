import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function DELETE(req) {
  try {
    const user = getUserFromRequest(req); 
    requireAdmin(user); 

    const body = await req.json();

    if (!body.id) {
      throw new Error("Event ID is required");
    }

    const deletedEvent = await prisma.events.delete({
      where: {
        id: Number(body.id), 
      },
    });

    return Response.json({
      message: "Event deleted successfully",
      deletedEvent,
    });
  } catch (err) {
    return Response.json(
      { message: err.message },
      { status: 403 }
    );
  }
}