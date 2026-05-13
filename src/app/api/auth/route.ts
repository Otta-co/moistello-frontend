import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SESSIONS_FILE = path.join(process.cwd(), "content", "sessions.json");
const USERS_FILE = path.join(process.cwd(), "content", "users.json");

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("moistello_session");
  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  const session = sessions.find((s: any) => s.token === cookie.value);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Session expires after 7 days
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let user = null;
  if (fs.existsSync(USERS_FILE)) {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    const u = users.find((u: any) => u.id === session.userId);
    if (u) user = { id: u.id, username: u.username, role: u.role };
  }

  return NextResponse.json({ authenticated: true, user });
}
