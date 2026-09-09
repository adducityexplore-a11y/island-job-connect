import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db, employersTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { verifyLegacyToken } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      recruiter?: { employerId: number; clerkUserId: string };
      candidateClerkUserId?: string;
    }
  }
}

function verifiedEmail(claims: Record<string, unknown> | undefined): string | undefined {
  if (!claims || claims.email_verified !== true) return undefined;
  const email = claims.email ?? claims.email_address;
  return typeof email === "string" ? email.toLowerCase() : undefined;
}

async function getVerifiedEmail(
  clerkUserId: string,
  claims: Record<string, unknown> | undefined,
): Promise<string | undefined> {
  const claimEmail = verifiedEmail(claims);
  if (claimEmail) return claimEmail;
  const user = await clerkClient.users.getUser(clerkUserId);
  const primary = user.emailAddresses.find(
    (address) =>
      address.id === user.primaryEmailAddressId &&
      address.verification?.status === "verified",
  );
  return primary?.emailAddress.toLowerCase();
}

export async function requireRecruiter(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const clerkUserId = auth?.sessionClaims?.userId || auth?.userId;
  if (!clerkUserId) {
    const legacy = verifyLegacyToken(req);
    if (!legacy) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [employer] = await db.select({ id: employersTable.id })
      .from(employersTable)
      .where(eq(employersTable.id, legacy.employerId))
      .limit(1);
    if (!employer) { res.status(401).json({ error: "Unauthorized" }); return; }
    req.recruiter = {
      employerId: employer.id,
      clerkUserId: `legacy-employer:${employer.id}`,
    };
    next();
    return;
  }
  const clerkId = String(clerkUserId);

  let [employer] = await db.select().from(employersTable)
    .where(eq(employersTable.clerkUserId, clerkId)).limit(1);
  // One-time bridge only accepts Clerk's explicitly verified email claim and
  // only claims an unlinked legacy employer record.
  if (!employer) {
    const email = await getVerifiedEmail(
      clerkId,
      auth.sessionClaims as Record<string, unknown> | undefined,
    );
    if (email) {
      [employer] = await db.update(employersTable).set({ clerkUserId: clerkId })
        .where(and(eq(employersTable.email, email), isNull(employersTable.clerkUserId))).returning();
    }
  }
  if (!employer) { res.status(403).json({ error: "No recruiter profile is linked to this Clerk account" }); return; }
  req.recruiter = { employerId: employer.id, clerkUserId: clerkId };
  next();
}

export function requireCandidate(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  // Clerk's canonical identity is `userId`; custom session claims are not a
  // reliable identity source and test sessions need not contain `userId`.
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.candidateClerkUserId = String(auth.userId);
  next();
}