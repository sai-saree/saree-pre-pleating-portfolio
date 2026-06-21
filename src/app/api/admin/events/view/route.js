import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return Response.json({ message: "id query parameter is required" }, { status: 400 });
    }

    const event = await prisma.events.findUnique({
      where: { id: Number(eventId) },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    // Compute stats
    const totalRegistrations = event.registrations.length;
    const paidCount = event.registrations.filter((r) => r.payment_status === "COMPLETED").length;
    const presentCount = event.registrations.filter((r) => r.attendance_status === "PRESENT").length;
    const certificatesSentCount = event.registrations.filter((r) => r.certificate_sent).length;
    const activeDriveAccessCount = event.registrations.filter((r) => r.has_drive_access).length;

    return Response.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        images: event.images,
        meet_link: event.meet_link,
        drive_folder_id: event.drive_folder_id,
      },
      stats: {
        total_registrations: totalRegistrations,
        paid_count: paidCount,
        present_count: presentCount,
        certificates_sent_count: certificatesSentCount,
        active_drive_access_count: activeDriveAccessCount,
      },
      registrations: event.registrations.map((r) => ({
        user_id: r.user_id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
        payment_status: r.payment_status,
        attendance_status: r.attendance_status,
        certificate_sent: r.certificate_sent,
        has_drive_access: r.has_drive_access,
        drive_access_expiry: r.drive_access_expiry,
      })),
    });
  } catch (err) {
    console.error("Admin view event error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
