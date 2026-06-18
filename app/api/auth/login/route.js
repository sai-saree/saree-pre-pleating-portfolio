import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ 1. find user
    const user = await prisma.users.findUnique({
      where: { email: body.email },
    });

    if (!user) throw new Error("User not found");

    // ✅ 2. compare password
    const isMatch = await bcrypt.compare(body.password, user.password);

    if (!isMatch) throw new Error("Invalid password");

    // ✅ 3. create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // optional but recommended
    );

    // ✅ 4. store token in cookie
    cookies().set("token", token, {
      httpOnly: true,     // 🔒 cannot be accessed by JS (important)
      secure: false,      // true in production (HTTPS)
      sameSite: "strict",
      path: "/",
    });

    // ✅ 5. response
    return Response.json({ message: "Login successful" });

  } catch (err) {
    return Response.json({ message: err.message }, { status: 400 });
  }
}