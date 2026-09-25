import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { verifiedEmailFromToken } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    if (!body.accessToken) return NextResponse.json({ message: "بيانات التأكيد ناقصة." }, { status: 400 });

    const email = await verifiedEmailFromToken(body.accessToken);
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return NextResponse.json({ message: "لا يوجد طلب تسجيل لهذا البريد." }, { status: 404 });

    if (!user.emailVerifiedAt) {
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تأكيد البريد." },
      { status: 400 },
    );
  }
}
