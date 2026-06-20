import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { checkAndRevokeExpiredAccess } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // 1. Run lazy revocation check to clean up any expired access before returning data
    await checkAndRevokeExpiredAccess();

    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ message: "Authentication required" }, { status: 401 });
    }

    const registrations = await prisma.registrations.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            time: true,
            location: true,
            meet_link: true,
            drive_folder_id: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format output to include helpful calculated fields for the frontend
    const formatted = registrations.map((reg) => {
      const driveFolderLink = reg.has_drive_access && reg.event.drive_folder_id
        ? `https://drive.google.com/drive/folders/${reg.event.drive_folder_id}`
        : null;

      return {
        event_id: reg.event_id,
        event_title: reg.event.title,
        event_description: reg.event.description,
        event_date: reg.event.date,
        event_time: reg.event.time,
        event_location: reg.event.location,
        meet_link: reg.payment_status === "COMPLETED" ? reg.event.meet_link : null,
        payment_status: reg.payment_status,
        attendance_status: reg.attendance_status,
        certificate_sent: reg.certificate_sent,
        has_drive_access: reg.has_drive_access,
        drive_access_expiry: reg.drive_access_expiry,
        drive_folder_link: driveFolderLink,
      };
    });

    return Response.json(formatted);
  } catch (err) {
    console.error("Fetch my registrations error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
