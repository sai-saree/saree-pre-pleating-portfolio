import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

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
      throw new Error("Email or phone already exists");
    }

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ create user
    const user = await prisma.users.create({
      data: {
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
        role: "admin", // keep for testing
      },
    });

    return Response.json({ message: "Signup successful" });

  } catch (err) {
  console.log("FULL ERROR:", err); // 👈 terminal will show real issue
  return Response.json(
    { message: err.message, error: err },
    { status: 500 }
  );
  }
}
