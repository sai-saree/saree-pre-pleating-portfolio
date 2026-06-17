import jwt from "jsonwebtoken";


export function getUserFromRequest(req) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;


  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}



