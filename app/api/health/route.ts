import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Database health check failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
