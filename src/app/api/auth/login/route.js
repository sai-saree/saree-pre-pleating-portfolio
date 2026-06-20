import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ validate inputs
    if (!body.email || !body.email.trim()) {
      return Response.json({ message: "Email is required" }, { status: 400 });
    }
    if (!body.password) {
      return Response.json({ message: "Password is required" }, { status: 400 });
    }

    // ✅ 1. find user
    const user = await prisma.users.findUnique({
      where: { email: body.email.trim() },
    });

    if (!user) {
      return Response.json({ message: "Invalid email or password" }, { status: 400 });
    }

    // ✅ 2. compare password
    const isMatch = await bcrypt.compare(body.password, user.password);

    if (!isMatch) {
      return Response.json({ message: "Invalid email or password" }, { status: 400 });
    }

    // ✅ 3. create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "default_development_secret_key",
      { expiresIn: "7d" }
    );

    // ✅ 4. store token in cookie
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,     // 🔒 cannot be accessed by JS (important)
      secure: false,      // true in production (HTTPS)
      sameSite: "strict",
      path: "/",
    });

    // ✅ 5. response
    return Response.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}