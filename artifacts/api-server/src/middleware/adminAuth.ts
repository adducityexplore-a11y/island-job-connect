import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { and, eq, isNull, sql } from "drizzle-orm";
import { adminAuditLogsTable, adminsTable, db } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      admin?: { id: number; clerkUserId: string };
    }
  }
}

function isVerifiedPrimaryEmail(user: Awaited<ReturnType<typeof clerkClient.users.getUser>>): string | undefined {
  const email = user.emailAddresses.find((address) =>
    address.id === user.primaryEmailAddressId && address.verification?.status === "verified",
  );
  return email?.emailAddress?.toLowerCase();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const clerkUserId = String(userId);
  const existingAdmins = await db.select().from(adminsTable)
    .where(and(eq(adminsTable.clerkUserId, clerkUserId), eq(adminsTable.active, true))).limit(1);
  let admin: typeof adminsTable.$inferSelect | undefined = existingAdmins[0];

  if (!admin) {
    // Email data comes only from Clerk's backend API. It is never accepted from a
    // request claim, header, or client-provided metadata.
    const user = await clerkClient.users.getUser(clerkUserId);
    const verifiedEmail = isVerifiedPrimaryEmail(user);
    if (verifiedEmail) {
      const allowedEmails = new Set(
        (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
      );
      admin = await db.transaction(async (tx) => {
        const [existing] = await tx.select().from(adminsTable)
          .where(sql`lower(${adminsTable.email}) = ${verifiedEmail}`).limit(1);
        if (existing) {
          if (!existing.active || (existing.clerkUserId && existing.clerkUserId !== clerkUserId)) return undefined;
          if (existing.clerkUserId === clerkUserId) return existing;
          const [linked] = await tx.update(adminsTable)
            .set({ clerkUserId, updatedAt: new Date() })
            .where(and(eq(adminsTable.id, existing.id), isNull(adminsTable.clerkUserId)))
            .returning();
          if (!linked) return undefined;
          await tx.insert(adminAuditLogsTable).values({
            adminId: linked.id, action: "admin.clerk_linked", entityType: "admin", entityId: String(linked.id), metadata: {},
          });
          return linked;
        }
        if (!allowedEmails.has(verifiedEmail)) return undefined;
        const [created] = await tx.insert(adminsTable).values({
          email: verifiedEmail, clerkUserId, active: true,
        }).returning();
        await tx.insert(adminAuditLogsTable).values({
          adminId: created.id, action: "admin.clerk_linked", entityType: "admin", entityId: String(created.id), metadata: {},
        });
        return created;
      });
    }
  }
  if (!admin) {
    req.log.warn({ event: "admin_authorization_denied", clerkUserId }, "Admin authorization denied");
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  req.admin = { id: admin.id, clerkUserId };
  next();
}