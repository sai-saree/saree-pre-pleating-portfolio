import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const events = await prisma.events.findMany({
      orderBy: {
        date: "asc",
      },
    });

    return Response.json(events);
  } catch (err) {
    console.error("Fetch events error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
