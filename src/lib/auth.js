import jwt from "jsonwebtoken";


export function getUserFromRequest(req) {
  if (!req) return null;
  const token = req.cookies?.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "default_development_secret_key");
  } catch {
    return null;
  }
}

export function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}



