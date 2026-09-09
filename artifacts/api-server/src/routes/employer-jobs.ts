import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, and, or, lt, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { requireRecruiter } from "../middleware/recruiterAuth.js";

const router = Router();

const EXPIRY_DAYS: Record<string, number> = {
  Normal: 30,
  Featured: 60,
  Urgent: 14,
};

const validateSalaryMetadata = (data: {
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: "USD" | "MVR";
  salaryPeriod?: "month";
}, ctx: z.RefinementCtx) => {
  if ((data.salaryMin !== undefined || data.salaryMax !== undefined)
    && (data.salaryCurrency === undefined || data.salaryPeriod === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["salaryCurrency"],
      message: "Salary currency and period are required when providing a salary",
    });
  }
};

const jobSchemaBase = z.object({
  title: z.string().min(2),
  department: z.string().min(1),
  location: z.string().min(1),
  experienceLevel: z.enum(["Entry Level", "1-2 Years", "3-5 Years", "5+ Years"]).nullable().optional(),
  candidateScope: z.enum(["Local", "International", "Both"]).nullable().optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.enum(["USD", "MVR"]).optional(),
  salaryPeriod: z.literal("month").optional(),
  description: z.string().min(10),
  requirements: z.string().optional(),
  type: z.enum(["Normal", "Featured", "Urgent"]).default("Normal"),
  applyMethod: z.enum(["whatsapp", "email"]).default("whatsapp"),
  applyContact: z.string().min(1),
  imageUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "closed"]).default("active"),
  source: z.string().min(1).optional(),
  originalSourceUrl: z.string().url().nullable().optional(),
  publishedAt: z.coerce.date().optional(),
  applicationDeadline: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  salaryDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  serviceCharge: z.string().optional(), serviceChargeDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  otherAllowances: z.string().optional(), otherAllowancesDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  overtime: z.string().optional(), overtimeDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  accommodation: z.string().optional(), accommodationDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  meals: z.string().optional(), mealsDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  healthInsurance: z.string().optional(), healthInsuranceDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  annualLeave: z.string().optional(), annualLeaveDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  airTicket: z.string().optional(), airTicketDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  workingHours: z.string().optional(), workingHoursDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  weeklyOff: z.string().optional(), weeklyOffDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  probation: z.string().optional(), probationDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
  contractLength: z.string().optional(), contractLengthDisclosure: z.enum(["provided", "not_disclosed", "not_provided"]).optional(),
});
const jobSchema = jobSchemaBase.superRefine(validateSalaryMetadata);
const jobUpdateSchema = jobSchemaBase.partial().superRefine(validateSalaryMetadata);

router.get("/employer/jobs", requireRecruiter, async (req, res) => {
  const jobs = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.employerId, req.recruiter!.employerId))
    .orderBy(jobsTable.createdAt);
  res.json(jobs);
});

router.post("/employer/jobs", requireRecruiter, async (req, res) => {
  const result = jobSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.issues });
    return;
  }

  const days = EXPIRY_DAYS[result.data.type] ?? 30;
  const expiresAt = result.data.expiresAt ?? new Date();
  if (!result.data.expiresAt) expiresAt.setDate(expiresAt.getDate() + days);

  const [job] = await db
    .insert(jobsTable)
    .values({ ...result.data, employerId: req.recruiter!.employerId, expiresAt, publishedAt: result.data.publishedAt ?? new Date() })
    .returning();

  res.status(201).json(job);
});

router.put("/employer/jobs/:id", requireRecruiter, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const result = jobUpdateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.issues });
    return;
  }

  const [job] = await db
    .update(jobsTable)
    .set({ ...result.data, updatedAt: new Date() })
    .where(and(eq(jobsTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId)))
    .returning();

  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(job);
});

router.post("/employer/jobs/:id/repost", requireRecruiter, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [original] = await db
    .select()
    .from(jobsTable)
    .where(and(eq(jobsTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId)));

  if (!original) { res.status(404).json({ error: "Job not found" }); return; }

  const days = EXPIRY_DAYS[original.type] ?? 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  const [job] = await db
    .insert(jobsTable)
    .values({
      employerId: original.employerId,
      title: original.title,
      department: original.department,
      location: original.location,
      experienceLevel: original.experienceLevel,
      candidateScope: original.candidateScope,
      salaryMin: original.salaryMin,
      salaryMax: original.salaryMax,
      salaryCurrency: original.salaryCurrency,
      salaryPeriod: original.salaryPeriod,
      description: original.description,
      requirements: original.requirements,
      type: original.type,
      applyMethod: original.applyMethod,
      applyContact: original.applyContact,
      imageUrl: original.imageUrl,
      status: "active",
      viewCount: 0,
      applyCount: 0,
      expiresAt, source: original.source, originalSourceUrl: original.originalSourceUrl,
      // A repost must never inherit a deadline that has already elapsed.
      publishedAt: new Date(), applicationDeadline: null,
      verificationStatus: original.verificationStatus, salaryDisclosure: original.salaryDisclosure,
      serviceCharge: original.serviceCharge, serviceChargeDisclosure: original.serviceChargeDisclosure,
      otherAllowances: original.otherAllowances, otherAllowancesDisclosure: original.otherAllowancesDisclosure,
      overtime: original.overtime, overtimeDisclosure: original.overtimeDisclosure,
      accommodation: original.accommodation, accommodationDisclosure: original.accommodationDisclosure,
      meals: original.meals, mealsDisclosure: original.mealsDisclosure,
      healthInsurance: original.healthInsurance, healthInsuranceDisclosure: original.healthInsuranceDisclosure,
      annualLeave: original.annualLeave, annualLeaveDisclosure: original.annualLeaveDisclosure,
      airTicket: original.airTicket, airTicketDisclosure: original.airTicketDisclosure,
      workingHours: original.workingHours, workingHoursDisclosure: original.workingHoursDisclosure,
      weeklyOff: original.weeklyOff, weeklyOffDisclosure: original.weeklyOffDisclosure,
      probation: original.probation, probationDisclosure: original.probationDisclosure,
      contractLength: original.contractLength, contractLengthDisclosure: original.contractLengthDisclosure,
    })
    .returning();

  res.status(201).json(job);
});

router.delete("/employer/jobs/expired", requireRecruiter, async (req, res) => {
  const now = new Date();
  const deleted = await db
    .update(jobsTable).set({ status: "closed", updatedAt: now })
    .where(
      and(
        eq(jobsTable.employerId, req.recruiter!.employerId),
        or(
          and(isNotNull(jobsTable.expiresAt), lt(jobsTable.expiresAt, now)),
          eq(jobsTable.status, "closed")
        )
      )
    )
    .returning({ id: jobsTable.id });
  res.json({ deleted: deleted.length });
});

router.delete("/employer/jobs/:id", requireRecruiter, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid job ID" }); return; }

  const [deleted] = await db
    .update(jobsTable).set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(jobsTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId)))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Job not found" }); return; }
  res.json({ success: true });
});

export default router;
