import { Router, type Response } from "express";
import { db, employersTable, jobsTable } from "@workspace/db";
import {
  GetPublicCompanyParams,
  GetPublicCompanyResponse,
  GetPublicJobParams,
  GetPublicJobResponse,
  ListPublicCompaniesResponse,
  ListPublicJobsQueryParams,
  ListPublicJobsResponse,
} from "@workspace/api-zod";
import { and, desc, eq, gt, ilike, isNull, lte, or, sql } from "drizzle-orm";

const router = Router();

const publicJobFields = {
  id: jobsTable.id,
  title: jobsTable.title,
  department: jobsTable.department,
  location: jobsTable.location,
  experienceLevel: jobsTable.experienceLevel,
  candidateScope: jobsTable.candidateScope,
  salaryMin: jobsTable.salaryMin,
  salaryMax: jobsTable.salaryMax,
  salaryCurrency: jobsTable.salaryCurrency,
  salaryPeriod: jobsTable.salaryPeriod,
  description: jobsTable.description,
  requirements: jobsTable.requirements,
  type: jobsTable.type,
  applyMethod: jobsTable.applyMethod,
  applyContact: jobsTable.applyContact,
  imageUrl: jobsTable.imageUrl,
  expiresAt: jobsTable.expiresAt,
  applicationDeadline: jobsTable.applicationDeadline,
  publishedAt: jobsTable.publishedAt,
  source: jobsTable.source,
  originalSourceUrl: jobsTable.originalSourceUrl,
  verificationStatus: jobsTable.verificationStatus,
  salaryDisclosure: jobsTable.salaryDisclosure,
  serviceCharge: jobsTable.serviceCharge,
  serviceChargeDisclosure: jobsTable.serviceChargeDisclosure,
  accommodation: jobsTable.accommodation,
  accommodationDisclosure: jobsTable.accommodationDisclosure,
  otherAllowances: jobsTable.otherAllowances,
  otherAllowancesDisclosure: jobsTable.otherAllowancesDisclosure,
  overtime: jobsTable.overtime,
  overtimeDisclosure: jobsTable.overtimeDisclosure,
  meals: jobsTable.meals,
  mealsDisclosure: jobsTable.mealsDisclosure,
  healthInsurance: jobsTable.healthInsurance,
  healthInsuranceDisclosure: jobsTable.healthInsuranceDisclosure,
  annualLeave: jobsTable.annualLeave,
  annualLeaveDisclosure: jobsTable.annualLeaveDisclosure,
  airTicket: jobsTable.airTicket,
  airTicketDisclosure: jobsTable.airTicketDisclosure,
  workingHours: jobsTable.workingHours,
  workingHoursDisclosure: jobsTable.workingHoursDisclosure,
  weeklyOff: jobsTable.weeklyOff,
  weeklyOffDisclosure: jobsTable.weeklyOffDisclosure,
  probation: jobsTable.probation,
  probationDisclosure: jobsTable.probationDisclosure,
  contractLength: jobsTable.contractLength,
  contractLengthDisclosure: jobsTable.contractLengthDisclosure,
  viewCount: jobsTable.viewCount,
  applyCount: jobsTable.applyCount,
  createdAt: jobsTable.createdAt,
  companyName: employersTable.companyName,
  logoUrl: employersTable.logoUrl,
  // A public vacancy badge requires both an administrator-verified employer
  // and the vacancy's own administrator-controlled verification status.
  verifiedEmployer: sql<boolean>`${employersTable.verified} AND ${jobsTable.verificationStatus} = 'verified'`,
};

const publicCompanyFields = {
  id: employersTable.id,
  companyName: employersTable.companyName,
  logoUrl: employersTable.logoUrl,
  // This is the explicit administrator-controlled verification field.
  verified: employersTable.verified,
  createdAt: employersTable.createdAt,
};

const offerFields = [
  "serviceCharge",
  "otherAllowances",
  "overtime",
  "accommodation",
  "meals",
  "healthInsurance",
  "annualLeave",
  "airTicket",
  "workingHours",
  "weeklyOff",
  "probation",
  "contractLength",
] as const;

type PublicJobOfferValues = {
  salaryMin: number | null;
  salaryMax: number | null;
} & Record<(typeof offerFields)[number], string | null>;

function activePublicJobConditions(now: Date) {
  return [
    eq(jobsTable.status, "active"),
    or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)),
    or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)),
  ];
}

async function closeExpiredJobs(now: Date): Promise<void> {
  await db
    .update(jobsTable)
    .set({ status: "closed", updatedAt: now })
    .where(and(
      eq(jobsTable.status, "active"),
      or(lte(jobsTable.expiresAt, now), lte(jobsTable.applicationDeadline, now)),
    ));
}

function withOfferInformationCompleteness<T extends PublicJobOfferValues>(job: T) {
  const disclosed = job.salaryMin !== null || job.salaryMax !== null ? 1 : 0;
  const completed = offerFields.reduce(
    (count, field) => count + (job[field] ? 1 : 0),
    disclosed,
  );
  return {
    ...job,
    offerInformationCompleteness: Math.round((completed / (offerFields.length + 1)) * 100),
  };
}

function invalid(res: Response): void {
  res.status(400).json({ error: "Invalid input" });
}

router.get("/jobs", async (req, res): Promise<void> => {
  const query = ListPublicJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    invalid(res);
    return;
  }

  const now = new Date();
  await closeExpiredJobs(now);
  const { q, department, location, experienceLevel, candidateScope } = query.data;
  const jobs = await db
    .select(publicJobFields)
    .from(jobsTable)
    .innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id))
    .where(and(
      ...activePublicJobConditions(now),
      ...(q ? [or(
        ilike(jobsTable.title, `%${q}%`),
        ilike(employersTable.companyName, `%${q}%`),
        ilike(jobsTable.location, `%${q}%`),
        ilike(jobsTable.description, `%${q}%`),
      )] : []),
      ...(department ? [eq(jobsTable.department, department)] : []),
      ...(location ? [eq(jobsTable.location, location)] : []),
      ...(experienceLevel ? [eq(jobsTable.experienceLevel, experienceLevel)] : []),
      ...(candidateScope ? [eq(jobsTable.candidateScope, candidateScope)] : []),
    ))
    .orderBy(desc(jobsTable.createdAt));

  res.json(ListPublicJobsResponse.parse(jobs.map(withOfferInformationCompleteness)));
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetPublicJobParams.safeParse(req.params);
  if (!params.success) {
    invalid(res);
    return;
  }

  const now = new Date();
  await closeExpiredJobs(now);
  const [job] = await db
    .select(publicJobFields)
    .from(jobsTable)
    .innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id))
    .where(and(eq(jobsTable.id, params.data.id), ...activePublicJobConditions(now)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(GetPublicJobResponse.parse(withOfferInformationCompleteness(job)));
});

router.get("/companies", async (_req, res): Promise<void> => {
  const companies = await db
    .select(publicCompanyFields)
    .from(employersTable)
    .orderBy(desc(employersTable.createdAt));
  res.json(ListPublicCompaniesResponse.parse(companies));
});

router.get("/companies/:id", async (req, res): Promise<void> => {
  const params = GetPublicCompanyParams.safeParse(req.params);
  if (!params.success) {
    invalid(res);
    return;
  }

  const [company] = await db
    .select(publicCompanyFields)
    .from(employersTable)
    .where(eq(employersTable.id, params.data.id))
    .limit(1);

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json(GetPublicCompanyResponse.parse(company));
});

router.post("/jobs/:id/view", async (req, res): Promise<void> => {
  const params = GetPublicJobParams.safeParse(req.params);
  if (!params.success) {
    invalid(res);
    return;
  }

  const updated = await db
    .update(jobsTable)
    .set({ viewCount: sql`${jobsTable.viewCount} + 1` })
    .where(and(eq(jobsTable.id, params.data.id), ...activePublicJobConditions(new Date())))
    .returning({ id: jobsTable.id });
  if (!updated.length) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ ok: true });
});

router.post("/jobs/:id/apply", async (req, res): Promise<void> => {
  const params = GetPublicJobParams.safeParse(req.params);
  if (!params.success) {
    invalid(res);
    return;
  }

  const updated = await db
    .update(jobsTable)
    .set({ applyCount: sql`${jobsTable.applyCount} + 1` })
    .where(and(eq(jobsTable.id, params.data.id), ...activePublicJobConditions(new Date())))
    .returning({ id: jobsTable.id });
  if (!updated.length) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ ok: true });
});

export default router;