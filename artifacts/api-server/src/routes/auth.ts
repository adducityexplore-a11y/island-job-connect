import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, employersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { signToken, requireAuth } from "../middleware/auth.js";
import { requireRecruiter } from "../middleware/recruiterAuth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/employer/register", async (req, res) => {
  // Clerk is the only supported path for new accounts. Keep this route in
  // place briefly so legacy clients receive an actionable compatibility error
  // rather than a route-not-found response.
  res.status(410).json({ error: "Recruiter registration has moved to Clerk" });
});

router.post("/auth/employer/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = result.data;
  const [employer] = await db
    .select()
    .from(employersTable)
    .where(eq(employersTable.email, email.toLowerCase()))
    .limit(1);

  if (!employer || !(await bcrypt.compare(password, employer.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ employerId: employer.id, email: employer.email });
  res.json({
    token,
    employer: {
      id: employer.id,
      email: employer.email,
      companyName: employer.companyName,
      contactName: employer.contactName,
      phone: employer.phone,
      logoUrl: employer.logoUrl,
    },
  });
});

router.get("/auth/employer/me", requireAuth, async (req, res) => {
  const [employer] = await db
    .select()
    .from(employersTable)
    .where(eq(employersTable.id, req.employer!.employerId))
    .limit(1);

  if (!employer) {
    res.status(404).json({ error: "Employer not found" });
    return;
  }

  res.json({
    id: employer.id,
    email: employer.email,
    companyName: employer.companyName,
    contactName: employer.contactName,
    phone: employer.phone,
    logoUrl: employer.logoUrl,
    verified: employer.verified,
  });
});

const profileSchema = z.object({
  companyName: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
});

router.patch("/employer/profile", requireRecruiter, async (req, res) => {
  const result = profileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.issues });
    return;
  }

  const [updated] = await db
    .update(employersTable)
    .set(result.data)
    .where(eq(employersTable.id, req.recruiter!.employerId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Employer not found" }); return; }

  res.json({
    id: updated.id,
    email: updated.email,
    companyName: updated.companyName,
    contactName: updated.contactName,
    phone: updated.phone,
    logoUrl: updated.logoUrl,
  });
});

export default router;
