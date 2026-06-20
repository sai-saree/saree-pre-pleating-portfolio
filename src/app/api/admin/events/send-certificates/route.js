import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { generateCertificate } from "@/lib/certificate";
import { sendCertificateEmail } from "@/lib/email";

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

    // Find users with COMPLETED payment and PRESENT attendance who haven't received their certificate
    const eligibleRegistrations = await prisma.registrations.findMany({
      where: {
        event_id: Number(body.event_id),
        user_id: body.user_ids ? { in: body.user_ids.map(Number) } : undefined,
        payment_status: "COMPLETED",
        attendance_status: "PRESENT",
        certificate_sent: false,
      },
      include: { user: true },
    });

    if (eligibleRegistrations.length === 0) {
      return Response.json({ message: "No eligible participants found to send certificates to." }, { status: 200 });
    }

    const results = [];
    for (const reg of eligibleRegistrations) {
      try {
        const pdfBytes = await generateCertificate({
          userName: reg.user.name,
          eventTitle: event.title,
          eventDate: event.date.toISOString().split("T")[0],
        });

        await sendCertificateEmail({
          userName: reg.user.name,
          userEmail: reg.user.email,
          eventTitle: event.title,
          pdfBuffer: pdfBytes,
        });

        // Mark as sent
        await prisma.registrations.update({
          where: {
            user_id_event_id: {
              user_id: reg.user_id,
              event_id: reg.event_id,
            },
          },
          data: {
            certificate_sent: true,
          },
        });

        results.push({ email: reg.user.email, status: "sent" });
      } catch (err) {
        console.error(`Failed to process certificate for ${reg.user.email}:`, err);
        results.push({ email: reg.user.email, status: "failed", error: err.message });
      }
    }

    return Response.json({
      message: "Certificates processing completed",
      processed_count: results.length,
      details: results,
    });
  } catch (err) {
    console.error("Certificate distribution error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
