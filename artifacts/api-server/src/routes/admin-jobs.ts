import { Router } from "express";
import {
  adminAuditLogsTable, applicationStages, applicationStatusHistoryTable, applicationsTable,
  candidatesTable, db, employersTable, jobsTable,
} from "@workspace/db";
import {
  CloseAdminJobParams, CloseAdminJobResponse, GetAdminApplicationParams, GetAdminApplicationResponse,
  GetAdminFunctionCheckResponse, GetAdminOverviewResponse, ListAdminApplicationsQueryParams,
  ListAdminApplicationsResponse, ListAdminAuditEventsQueryParams, ListAdminAuditEventsResponse,
  ListAdminCandidatesQueryParams, ListAdminCandidatesResponse, ListAdminEmployersQueryParams,
  ListAdminEmployersResponse, ListAdminJobsQueryParams, ListAdminJobsResponse, RepostAdminJobParams,
  UpdateAdminApplicationStatusBody, UpdateAdminApplicationStatusParams, UpdateAdminApplicationStatusResponse,
  UpdateAdminEmployerVerificationBody, UpdateAdminEmployerVerificationParams, UpdateAdminEmployerVerificationResponse,
} from "@workspace/api-zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();
const EXPIRY_DAYS: Record<string, number> = { Normal: 30, Featured: 60, Urgent: 14 };

function invalid(res: import("express").Response): void {
  res.status(400).json({ error: "Invalid input" });
}
const employerFields = {
  id: employersTable.id, companyName: employersTable.companyName, contactName: employersTable.contactName,
  verified: employersTable.verified, createdAt: employersTable.createdAt,
};
const jobFields = {
  id: jobsTable.id, employerId: jobsTable.employerId, title: jobsTable.title, department: jobsTable.department,
  location: jobsTable.location, status: jobsTable.status, type: jobsTable.type, expiresAt: jobsTable.expiresAt,
  verificationStatus: jobsTable.verificationStatus, createdAt: jobsTable.createdAt,
};
const candidateFields = {
  id: candidatesTable.id, fullName: candidatesTable.fullName, email: candidatesTable.email, phone: candidatesTable.phone,
  location: candidatesTable.location, headline: candidatesTable.headline, jobsMvReviewed: candidatesTable.jobsMvReviewed,
  reviewedAt: candidatesTable.reviewedAt, createdAt: candidatesTable.createdAt,
};
const applicationFields = {
  id: applicationsTable.id, jobId: applicationsTable.jobId, candidateId: applicationsTable.candidateId,
  status: applicationsTable.status, createdAt: applicationsTable.createdAt,
};

router.use("/admin", requireAdmin);

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const [counts] = await db.select({
    employers: sql<number>`(select count(*)::int from ${employersTable})`,
    jobs: sql<number>`(select count(*)::int from ${jobsTable})`,
    candidates: sql<number>`(select count(*)::int from ${candidatesTable})`,
    applications: sql<number>`(select count(*)::int from ${applicationsTable})`,
  }).from(employersTable).limit(1);
  res.json(GetAdminOverviewResponse.parse(counts));
});

router.get("/admin/function-check", async (_req, res): Promise<void> => {
  const [counts] = await db.select({
    employers: sql<number>`(select count(*)::int from ${employersTable})`,
    jobs: sql<number>`(select count(*)::int from ${jobsTable})`,
    candidates: sql<number>`(select count(*)::int from ${candidatesTable})`,
    applications: sql<number>`(select count(*)::int from ${applicationsTable})`,
  }).from(employersTable).limit(1);
  res.json(GetAdminFunctionCheckResponse.parse({ api: "ok", database: "ok", counts }));
});

router.get("/admin/employers", async (req, res): Promise<void> => {
  const parsed = ListAdminEmployersQueryParams.safeParse(req.query); if (!parsed.success) return invalid(res);
  const { limit, offset } = parsed.data;
  const [items, total] = await Promise.all([
    db.select(employerFields).from(employersTable).orderBy(desc(employersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(employersTable),
  ]);
  res.json(ListAdminEmployersResponse.parse({ items, total: total[0].count, limit, offset }));
});

router.patch("/admin/employers/:id/verification", async (req, res): Promise<void> => {
  const params = UpdateAdminEmployerVerificationParams.safeParse(req.params);
  const body = UpdateAdminEmployerVerificationBody.safeParse(req.body);
  if (!params.success || !body.success) return invalid(res);
  const employer = await db.transaction(async (tx) => {
    const [updated] = await tx.update(employersTable).set({ verified: body.data.verified })
      .where(eq(employersTable.id, params.data.id)).returning(employerFields);
    if (!updated) return undefined;
    await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "employer.verification_updated", entityType: "employer", entityId: String(updated.id), metadata: { verified: updated.verified } });
    return updated;
  });
  if (!employer) { res.status(404).json({ error: "Employer not found" }); return; }
  req.log.info({ event: "admin_employer_verification_updated", entityId: employer.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.json(UpdateAdminEmployerVerificationResponse.parse(employer));
});

router.get("/admin/jobs", async (req, res): Promise<void> => {
  const parsed = ListAdminJobsQueryParams.safeParse(req.query); if (!parsed.success) return invalid(res);
  const { limit, offset } = parsed.data;
  const [items, total] = await Promise.all([
    db.select(jobFields).from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(jobsTable),
  ]);
  res.json(ListAdminJobsResponse.parse({ items, total: total[0].count, limit, offset }));
});

router.post("/admin/jobs/:id/close", async (req, res): Promise<void> => {
  const params = CloseAdminJobParams.safeParse(req.params); if (!params.success) return invalid(res);
  const job = await db.transaction(async (tx) => {
    const [updated] = await tx.update(jobsTable).set({ status: "closed", updatedAt: new Date() })
      .where(eq(jobsTable.id, params.data.id)).returning(jobFields);
    if (!updated) return undefined;
    await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "job.closed", entityType: "job", entityId: String(updated.id), metadata: {} });
    return updated;
  });
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  req.log.info({ event: "admin_job_closed", entityId: job.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.json(CloseAdminJobResponse.parse(job));
});
router.patch("/admin/jobs/:id/verification", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = z.object({ verificationStatus: z.enum(["unverified", "verified", "needs_review"]) }).safeParse(req.body);
  if (!Number.isInteger(id) || !body.success) return invalid(res);
  const job = await db.transaction(async (tx) => {
    const [updated] = await tx.update(jobsTable).set({ verificationStatus: body.data.verificationStatus, updatedAt: new Date() })
      .where(eq(jobsTable.id, id)).returning(jobFields);
    if (!updated) return undefined;
    await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "job.verification_updated", entityType: "job", entityId: String(updated.id), metadata: { verificationStatus: updated.verificationStatus } });
    return updated;
  });
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  req.log.info({ event: "admin_job_verification_updated", entityId: job.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.json(job);
});

router.post("/admin/jobs/:id/repost", async (req, res): Promise<void> => {
  const params = RepostAdminJobParams.safeParse(req.params); if (!params.success) return invalid(res);
  const job = await db.transaction(async (tx) => {
    const [original] = await tx.select().from(jobsTable).where(eq(jobsTable.id, params.data.id)).limit(1);
    if (!original) return undefined;
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + (EXPIRY_DAYS[original.type] ?? 30));
    const [created] = await tx.insert(jobsTable).values({
      employerId: original.employerId, title: original.title, department: original.department, location: original.location,
      salaryMin: original.salaryMin, salaryMax: original.salaryMax, salaryCurrency: original.salaryCurrency, salaryPeriod: original.salaryPeriod, description: original.description, requirements: original.requirements,
      type: original.type, applyMethod: original.applyMethod, applyContact: original.applyContact, imageUrl: original.imageUrl,
      status: "active", viewCount: 0, applyCount: 0, expiresAt,
      source: original.source, originalSourceUrl: original.originalSourceUrl, publishedAt: new Date(),
      // Reposts require a current review and must not carry an old deadline.
      applicationDeadline: null, verificationStatus: "unverified",
      salaryDisclosure: original.salaryDisclosure,
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
    }).returning(jobFields);
    await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "job.reposted", entityType: "job", entityId: String(created.id), metadata: { sourceJobId: original.id } });
    return created;
  });
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  req.log.info({ event: "admin_job_reposted", entityId: job.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.status(201).json(CloseAdminJobResponse.parse(job));
});

router.get("/admin/candidates", async (req, res): Promise<void> => {
  const parsed = ListAdminCandidatesQueryParams.safeParse(req.query); if (!parsed.success) return invalid(res);
  const { limit, offset } = parsed.data;
  const [items, total] = await Promise.all([
    db.select(candidateFields).from(candidatesTable).orderBy(desc(candidatesTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(candidatesTable),
  ]);
  res.json(ListAdminCandidatesResponse.parse({ items, total: total[0].count, limit, offset }));
});
router.patch("/admin/candidates/:id/review", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = z.object({ jobsMvReviewed: z.boolean(), reviewNotes: z.string().max(5000).nullable().optional() }).safeParse(req.body);
  if (!Number.isInteger(id) || !body.success) return invalid(res);
  const candidate = await db.transaction(async (tx) => {
    const reviewedAt = body.data.jobsMvReviewed ? new Date() : null;
    const [updated] = await tx.update(candidatesTable).set({
      jobsMvReviewed: body.data.jobsMvReviewed,
      reviewedBy: body.data.jobsMvReviewed ? req.admin!.clerkUserId : null,
      reviewedAt,
      reviewNotes: body.data.reviewNotes ?? null,
      updatedAt: new Date(),
    }).where(eq(candidatesTable.id, id)).returning(candidateFields);
    if (!updated) return undefined;
    await tx.insert(adminAuditLogsTable).values({
      adminId: req.admin!.id, action: "candidate.review_updated", entityType: "candidate", entityId: String(updated.id),
      metadata: { jobsMvReviewed: updated.jobsMvReviewed },
    });
    return updated;
  });
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
  req.log.info({ event: "admin_candidate_review_updated", entityId: candidate.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.json(candidate);
});

router.get("/admin/applications", async (req, res): Promise<void> => {
  const parsed = ListAdminApplicationsQueryParams.safeParse(req.query); if (!parsed.success) return invalid(res);
  const { limit, offset } = parsed.data;
  const [items, total] = await Promise.all([
    db.select(applicationFields).from(applicationsTable).orderBy(desc(applicationsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(applicationsTable),
  ]);
  res.json(ListAdminApplicationsResponse.parse({ items, total: total[0].count, limit, offset }));
});

router.get("/admin/applications/:id", async (req, res): Promise<void> => {
  const params = GetAdminApplicationParams.safeParse(req.params); if (!params.success) return invalid(res);
  const [row] = await db.select({ application: applicationFields, candidate: candidateFields, job: jobFields })
    .from(applicationsTable).innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id)).where(eq(applicationsTable.id, params.data.id));
  if (!row) { res.status(404).json({ error: "Application not found" }); return; }
  const history = await db.select({ id: applicationStatusHistoryTable.id, status: applicationStatusHistoryTable.status, note: applicationStatusHistoryTable.note, createdAt: applicationStatusHistoryTable.createdAt })
    .from(applicationStatusHistoryTable).where(eq(applicationStatusHistoryTable.applicationId, params.data.id)).orderBy(desc(applicationStatusHistoryTable.createdAt));
  res.json(GetAdminApplicationResponse.parse({ ...row, history }));
});

router.patch("/admin/applications/:id/status", async (req, res): Promise<void> => {
  const params = UpdateAdminApplicationStatusParams.safeParse(req.params);
  const body = UpdateAdminApplicationStatusBody.safeParse(req.body);
  if (!params.success || !body.success || !applicationStages.includes(body.data.status)) return invalid(res);
  const updated = await db.transaction(async (tx) => {
    const changedAt = new Date();
    const timestampFields: Partial<Record<typeof applicationStages[number], object>> = {
      "Reviewed": { reviewedAt: changedAt }, "Shortlisted": { shortlistedAt: changedAt }, "Interview": { interviewAt: changedAt },
      "Offered": { offeredAt: changedAt }, "Hired": { hiredAt: changedAt }, "Not Selected": { notSelectedAt: changedAt },
    };
    const timestampField = timestampFields[body.data.status] ?? {};
    const [application] = await tx.update(applicationsTable).set({ status: body.data.status, updatedAt: changedAt, ...timestampField })
      .where(eq(applicationsTable.id, params.data.id)).returning(applicationFields);
    if (!application) return undefined;
    await tx.insert(applicationStatusHistoryTable).values({ applicationId: application.id, status: body.data.status, note: body.data.note, changedByClerkUserId: req.admin!.clerkUserId });
    await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "application.status_updated", entityType: "application", entityId: String(application.id), metadata: { status: application.status } });
    return application;
  });
  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
  req.log.info({ event: "admin_application_status_updated", entityId: updated.id, adminId: req.admin!.id }, "Admin mutation completed");
  res.json(UpdateAdminApplicationStatusResponse.parse(updated));
});

router.get("/admin/audit-events", async (req, res): Promise<void> => {
  const parsed = ListAdminAuditEventsQueryParams.safeParse(req.query); if (!parsed.success) return invalid(res);
  const items = await db.select({ id: adminAuditLogsTable.id, action: adminAuditLogsTable.action, entityType: adminAuditLogsTable.entityType, entityId: adminAuditLogsTable.entityId, metadata: adminAuditLogsTable.metadata, createdAt: adminAuditLogsTable.createdAt })
    .from(adminAuditLogsTable).orderBy(desc(adminAuditLogsTable.createdAt)).limit(parsed.data.limit);
  res.json(ListAdminAuditEventsResponse.parse({ items }));
});

export default router;