export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { grantDriveAccess } from "@/lib/google-drive";
import { sendDriveAccessEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const body = await req.json();

    if (!body.event_id) {
      return Response.json({ message: "event_id is required" }, { status: 400 });
    }

    const event = await prisma.events.findUnique({
      where: { id: Number(body.event_id) },
    });

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    if (!event.drive_folder_id) {
      return Response.json({ message: "Event has no drive_folder_id set." }, { status: 400 });
    }

    // Find users who paid, attended, and do not currently have drive access
    const eligibleRegistrations = await prisma.registrations.findMany({
      where: {
        event_id: Number(body.event_id),
        user_id: body.user_ids ? { in: body.user_ids.map(Number) } : undefined,
        payment_status: "COMPLETED",
        attendance_status: "PRESENT",
        has_drive_access: false,
      },
      include: { user: true },
    });

    if (eligibleRegistrations.length === 0) {
      return Response.json({ message: "No eligible participants found for drive access." }, { status: 200 });
    }

    const results = [];
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    for (const reg of eligibleRegistrations) {
      try {
        // Grant Google Drive access via Google Drive API
        const { permissionId } = await grantDriveAccess(event.drive_folder_id, reg.user.email);

        // Update database: has_drive_access = true, set drive_permission_id, set drive_access_expiry
        await prisma.registrations.update({
          where: {
            user_id_event_id: {
              user_id: reg.user_id,
              event_id: reg.event_id,
            },
          },
          data: {
            has_drive_access: true,
            drive_permission_id: permissionId,
            drive_access_expiry: expiryDate,
          },
        });

        // Send confirmation email
        const driveFolderLink = `https://drive.google.com/drive/folders/${event.drive_folder_id}`;
        await sendDriveAccessEmail({
          userName: reg.user.name,
          userEmail: reg.user.email,
          eventTitle: event.title,
          driveFolderLink,
          expiryDate,
        });

        results.push({ email: reg.user.email, status: "granted" });
      } catch (err) {
        console.error(`Failed to grant drive access for ${reg.user.email}:`, err);
        results.push({ email: reg.user.email, status: "failed", error: err.message });
      }
    }

    return Response.json({
      message: "Drive access processing completed",
      processed_count: results.length,
      details: results,
    });
  } catch (err) {
    console.error("Grant drive access error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
