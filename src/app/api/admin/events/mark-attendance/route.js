export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    const adminUser = getUserFromRequest(req);
    requireAdmin(adminUser);

    const body = await req.json();

    if (!body.event_id) {
      return Response.json({ message: "event_id is required" }, { status: 400 });
    }

    if (!body.attendance || !Array.isArray(body.attendance)) {
      return Response.json({ message: "attendance must be an array of user objects" }, { status: 400 });
    }

    const eventId = Number(body.event_id);

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    const results = [];
    const validStatuses = ["PRESENT", "ABSENT", "NOT_MARKED"];

    for (const record of body.attendance) {
      if (!record.user_id || !record.status) {
        continue;
      }

      const userId = Number(record.user_id);
      const status = record.status.toUpperCase();

      if (!validStatuses.includes(status)) {
        continue;
      }

      try {
        const updated = await prisma.registrations.update({
          where: {
            user_id_event_id: {
              user_id: userId,
              event_id: eventId,
            },
          },
          data: {
            attendance_status: status,
          },
        });
        results.push({ user_id: userId, status: updated.attendance_status, success: true });
      } catch (err) {
        results.push({ user_id: userId, error: "Registration not found or update failed", success: false });
      }
    }

    return Response.json({
      message: "Attendance updated completed",
      results,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
