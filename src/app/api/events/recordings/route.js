import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { checkAndRevokeExpiredAccess } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // 1. Run lazy revocation check to clean up any expired access
    await checkAndRevokeExpiredAccess();

    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ message: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return Response.json({ message: "event_id query parameter is required" }, { status: 400 });
    }

    // Find user's registration for this event
    const registration = await prisma.registrations.findUnique({
      where: {
        user_id_event_id: {
          user_id: user.id,
          event_id: Number(eventId),
        },
      },
      include: { event: true },
    });

    if (!registration) {
      return Response.json({ message: "No registration found for this event." }, { status: 404 });
    }

    // Verify if user has active drive access
    if (!registration.has_drive_access) {
      return Response.json({ 
        message: "Access to recordings is not active (either expired, not yet granted, or payment/attendance requirements not met)." 
      }, { status: 403 });
    }

    const driveFolderLink = `https://drive.google.com/drive/folders/${registration.event.drive_folder_id}`;

    return Response.json({
      message: "Access verified",
      drive_folder_link: driveFolderLink,
      expiry_date: registration.drive_access_expiry,
    });
  } catch (err) {
    console.error("Fetch recordings link error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
