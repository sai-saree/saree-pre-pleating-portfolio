import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ validate required fields
    if (!body.name || !body.name.trim()) {
      return Response.json({ message: "Name is required" }, { status: 400 });
    }
    if (!body.email || !body.email.trim()) {
      return Response.json({ message: "Email is required" }, { status: 400 });
    }
    if (!body.phone || !body.phone.trim()) {
      return Response.json({ message: "Phone is required" }, { status: 400 });
    }
    if (!body.password || body.password.length < 6) {
      return Response.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // ✅ check duplicate email or phone
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: body.email },
          { phone: body.phone }
        ]
      }
    });

    if (existingUser) {
      return Response.json({ message: "Email or phone already exists" }, { status: 400 });
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ create user
    const user = await prisma.users.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        password: hashedPassword,
        role: "user",
      },
    });

    return Response.json({ message: "Signup successful" });

  } catch (err) {
    console.log("FULL ERROR:", err); // 👈 terminal will show real issue
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
