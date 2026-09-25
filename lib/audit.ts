import "server-only";

import { getDb } from "@/db";
import { auditLogs, type User } from "@/db/schema";

type AuditMetadata = Record<string, string | number | boolean | null>;

export async function writeAuditLog(
  user: Pick<User, "id" | "fullName" | "email">,
  eventType: string,
  eventLabel: string,
  metadata: AuditMetadata = {},
) {
  await getDb().insert(auditLogs).values({
    userId: user.id,
    actorName: user.fullName,
    actorEmail: user.email,
    eventType,
    eventLabel,
    metadata,
  });
}
