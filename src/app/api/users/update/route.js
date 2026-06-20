import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return Response.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const updateData = {};

    if (body.name && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (body.email && body.email.trim()) {
      const email = body.email.trim().toLowerCase();
      // Check duplicate email
      const duplicateUser = await prisma.users.findFirst({
        where: {
          email,
          id: { not: user.id },
        },
      });
      if (duplicateUser) {
        return Response.json({ message: "Email is already taken by another account" }, { status: 400 });
      }
      updateData.email = email;
    }

    if (body.phone && body.phone.trim()) {
      const phone = body.phone.trim();
      if (phone.length !== 10 || isNaN(phone)) {
        return Response.json({ message: "Phone number must be exactly 10 digits" }, { status: 400 });
      }
      // Check duplicate phone
      const duplicatePhone = await prisma.users.findFirst({
        where: {
          phone,
          id: { not: user.id },
        },
      });
      if (duplicatePhone) {
        return Response.json({ message: "Phone number is already registered to another account" }, { status: 400 });
      }
      updateData.phone = phone;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ message: "No valid update fields provided" }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
    });

    return Response.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return Response.json({ message: err.message }, { status: 500 });
  }
}
