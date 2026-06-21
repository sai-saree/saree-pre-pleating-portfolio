export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getUserFromRequest, requireAdmin } from "@/lib/auth";

export async function DELETE(req) {
  try {
    const adminUser = getUserFromRequest(req);
    requireAdmin(adminUser);

    const body = await req.json();

    if (!body.id) {
      return Response.json({ message: "User id is required" }, { status: 400 });
    }

    const userIdToDelete = Number(body.id);

    // Prevent admin from deleting themselves
    if (userIdToDelete === adminUser.id) {
      return Response.json({ message: "You cannot delete your own admin account" }, { status: 400 });
    }

    // Verify user exists
    const userToDelete = await prisma.users.findUnique({
      where: { id: userIdToDelete },
    });

    if (!userToDelete) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    // Delete user
    const deletedUser = await prisma.users.delete({
      where: { id: userIdToDelete },
    });

    return Response.json({
      message: "User deleted successfully",
      deletedUser: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
      },
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return Response.json({ message: err.message }, { status: err.message === "Unauthorized" ? 403 : 500 });
  }
}
