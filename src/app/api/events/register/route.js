import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ message: "Authentication required" }, { status: 401 });
    }
    if (user.role === "admin") {
      return Response.json({ message: "Administrators cannot register for events." }, { status: 400 });
    }

    const body = await req.json();
    if (!body.event_id) {
      return Response.json({ message: "event_id is required" }, { status: 400 });
    }

    const eventId = Number(body.event_id);

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.registrations.findUnique({
      where: {
        user_id_event_id: {
          user_id: user.id,
          event_id: eventId,
        },
      },
    });

    if (existingRegistration) {
      return Response.json({ message: "You are already registered for this event" }, { status: 400 });
    }

    // Create registration
    const registration = await prisma.registrations.create({
      data: {
        user_id: user.id,
        event_id: eventId,
        payment_status: "PENDING",
        attendance_status: "NOT_MARKED",
      },
    });

    return Response.json({
      message: "Successfully registered for event",
      registration,
    });
  } catch (err) {
    console.error("Register event error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
