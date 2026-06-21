import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";
import { sendMeetLinkEmail, sendEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    requireAdmin(user);

    const body = await req.json();

    if (!body.event_id) {
      return Response.json({ message: "event_id is required" }, { status: 400 });
    }
    if (!body.user_ids || !Array.isArray(body.user_ids) || body.user_ids.length === 0) {
      return Response.json({ message: "user_ids array is required" }, { status: 400 });
    }

    // Fetch event details
    const event = await prisma.events.findUnique({
      where: { id: Number(body.event_id) },
    });

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    // Update payment status for all matching registrations
    await prisma.registrations.updateMany({
      where: {
        event_id: Number(body.event_id),
        user_id: { in: body.user_ids.map(Number) },
      },
      data: {
        payment_status: "COMPLETED",
      },
    });

    // Fetch the updated registrations with user info to send emails
    const registrations = await prisma.registrations.findMany({
      where: {
        event_id: Number(body.event_id),
        user_id: { in: body.user_ids.map(Number) },
        payment_status: "COMPLETED",
      },
      include: { user: true },
    });

    const emailsSent = [];
    for (const reg of registrations) {
      try {
        if (event.meet_link) {
          await sendMeetLinkEmail({
            userName: reg.user.name,
            userEmail: reg.user.email,
            eventTitle: event.title,
            eventDate: event.date.toISOString().split("T")[0],
            eventTime: event.time,
            meetLink: event.meet_link,
          });
          emailsSent.push({ email: reg.user.email, status: "success" });
        } else {
          // Send general payment confirmation without meet link
          await sendEmail({
            to: reg.user.email,
            subject: `✅ Payment Confirmed: ${event.title}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #e8437f, #f06292); padding: 30px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Payment Confirmed! 🎉</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <strong>${reg.user.name}</strong>,</p>
                  <p style="font-size: 15px; color: #555; line-height: 1.5;">Your payment for the workshop <strong>${event.title}</strong> has been approved. The details for joining will be shared with you soon.</p>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e8437f;">
                    <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>📅 Date:</strong> ${event.date.toISOString().split("T")[0]}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>🕐 Time:</strong> ${event.time || "TBA"}</p>
                  </div>
                </div>
              </div>
            `,
          });
          emailsSent.push({ email: reg.user.email, status: "success_no_meet" });
        }
      } catch (err) {
        console.error(`Failed to send email to ${reg.user.email}:`, err);
        emailsSent.push({ email: reg.user.email, status: "failed", error: err.message });
      }
    }

    return Response.json({
      message: "Payments approved successfully",
      updated_count: registrations.length,
      emails: emailsSent,
    });
  } catch (err) {
    console.error("Payment approval error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
