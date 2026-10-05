import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { emailFromRecoveryCode, verifiedEmailFromToken } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string; code?: string };
    if (!body.accessToken && !body.code) {
      return NextResponse.json({ message: "بيانات الرابط ناقصة." }, { status: 400 });
    }

    const email = body.accessToken
      ? await verifiedEmailFromToken(body.accessToken)
      : await emailFromRecoveryCode(body.code as string);

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return NextResponse.json({ message: "لا يوجد حساب بهذا البريد." }, { status: 404 });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "رابط الاستعادة غير صالح أو انتهت صلاحيته." },
      { status: 400 },
    );
  }
}
