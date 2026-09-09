import { Router } from "express";
import { db, applicationsTable, applicationStatusHistoryTable, applicationStages, candidateSavedJobsTable, candidatesTable, employerCandidateInvitationsTable, employerSavedCandidatesTable, employersTable, jobsTable, recruitmentAssignmentsTable } from "@workspace/db";
import { and, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { requireCandidate, requireRecruiter } from "../middleware/recruiterAuth.js";
import { clerkClient, getAuth } from "@clerk/express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage.js";
import {
  CreateApplicationBody,
  DeleteRecruiterTalentSavedParams,
  DeleteRecruiterTalentSavedResponse,
  GetCandidateJobApplicationStatusParams,
  GetCandidateJobApplicationStatusResponse,
  GetCandidateProfileResponse,
  GetRecruiterTalentParams,
  GetRecruiterTalentResponse,
  InviteRecruiterTalentBody,
  InviteRecruiterTalentParams,
  RegisterRecruiterBody,
  SaveRecruiterTalentParams,
  SaveRecruiterTalentResponse,
  SearchRecruiterTalentQueryParams,
  SearchRecruiterTalentResponse,
  UpsertCandidateProfileBody,
  UpsertCandidateProfileResponse,
} from "@workspace/api-zod";

const router = Router();
const objectStorageService = new ObjectStorageService();
const statusSchema = z.object({ status: z.enum(applicationStages), note: z.string().max(1000).optional() });
const companySchema = z.object({
  companyName: z.string().min(2).optional(), contactName: z.string().min(2).optional(),
  phone: z.string().optional(), logoUrl: z.string().url().nullable().optional(),
});
const inviteRecruiterTalentResponseSchema = z.object({
  id: z.number(),
  employerId: z.number(),
  candidateId: z.number(),
  jobId: z.number(),
  message: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
const recruiterCandidateFields = {
  id: candidatesTable.id, email: candidatesTable.email, fullName: candidatesTable.fullName,
  phone: candidatesTable.phone, location: candidatesTable.location, headline: candidatesTable.headline,
  summary: candidatesTable.summary, yearsExperience: candidatesTable.yearsExperience,
  hospitalitySpecialties: candidatesTable.hospitalitySpecialties, languages: candidatesTable.languages,
  availability: candidatesTable.availability,
  currentEmployer: candidatesTable.currentEmployer, nationality: candidatesTable.nationality,
  totalHospitalityExperience: candidatesTable.totalHospitalityExperience, totalResortExperience: candidatesTable.totalResortExperience,
  maldivesExperience: candidatesTable.maldivesExperience, luxuryResortExperience: candidatesTable.luxuryResortExperience,
  roleSpecificSkills: candidatesTable.roleSpecificSkills, technicalSkills: candidatesTable.technicalSkills, posSystems: candidatesTable.posSystems,
  leadershipExperience: candidatesTable.leadershipExperience, education: candidatesTable.education,
  professionalCertifications: candidatesTable.professionalCertifications, hospitalityCertifications: candidatesTable.hospitalityCertifications,
  employmentStatus: candidatesTable.employmentStatus, noticePeriod: candidatesTable.noticePeriod,
  availableFrom: candidatesTable.availableFrom, currentlyInMaldives: candidatesTable.currentlyInMaldives,
  workHistory: candidatesTable.workHistory, languageProficiencies: candidatesTable.languageProficiencies,
  jobsMvReviewed: candidatesTable.jobsMvReviewed, reviewedAt: candidatesTable.reviewedAt,
  cvAvailable: sql<boolean>`${candidatesTable.cvObjectPath} is not null`,
};
const companyFields = {
  id: employersTable.id, email: employersTable.email, companyName: employersTable.companyName,
  contactName: employersTable.contactName, phone: employersTable.phone, logoUrl: employersTable.logoUrl,
  verified: employersTable.verified,
};

function verifiedEmail(claims: Record<string, unknown> | undefined): string | undefined {
  if (!claims || claims.email_verified !== true) return undefined;
  const email = claims.email ?? claims.email_address;
  return typeof email === "string" ? email.toLowerCase() : undefined;
}

function candidateProfileResponse(candidate: typeof candidatesTable.$inferSelect) {
  const { cvObjectPath, ...profile } = candidate;
  return GetCandidateProfileResponse.parse({ ...profile, cvAvailable: Boolean(cvObjectPath) });
}

async function getVerifiedEmail(
  clerkUserId: string,
  claims: Record<string, unknown> | undefined,
): Promise<string | undefined> {
  const claimEmail = verifiedEmail(claims);
  if (claimEmail) return claimEmail;
  const user = await clerkClient.users.getUser(clerkUserId);
  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && address.verification?.status === "verified",
  );
  return primary?.emailAddress.toLowerCase();
}

router.get("/candidate/profile", requireCandidate, async (req, res) => {
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.status(404).json({ error: "Candidate profile not found" }); return; }
  res.json(candidateProfileResponse(candidate));
});
router.put("/candidate/profile", requireCandidate, async (req, res) => {
  const parsed = UpsertCandidateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: candidatesTable.id }).from(candidatesTable)
      .where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1).for("update");
    const [updated] = existing
      ? await tx.update(candidatesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(candidatesTable.id, existing.id)).returning()
      : await tx.insert(candidatesTable).values({ ...parsed.data, clerkUserId: req.candidateClerkUserId! }).returning();
    // Consent withdrawal removes every recruitment assignment atomically.
    if (parsed.data.openToOpportunities === false) {
      await tx.delete(recruitmentAssignmentsTable).where(eq(recruitmentAssignmentsTable.candidateId, updated.id));
      await tx.delete(employerSavedCandidatesTable).where(eq(employerSavedCandidatesTable.candidateId, updated.id));
      await tx.delete(employerCandidateInvitationsTable).where(eq(employerCandidateInvitationsTable.candidateId, updated.id));
    }
    return { candidate: updated, existed: Boolean(existing) };
  });
  res.status(result.existed ? 200 : 201).json(UpsertCandidateProfileResponse.parse(candidateProfileResponse(result.candidate)));
});

router.post("/jobs/:id/applications", requireCandidate, async (req, res) => {
  const jobId = Number(req.params.id); const parsed = CreateApplicationBody.safeParse(req.body);
  if (!Number.isInteger(jobId) || !parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.status(409).json({ error: "Create a candidate profile before applying" }); return; }
  const now = new Date();
  const [job] = await db.select({ id: jobsTable.id }).from(jobsTable).where(and(eq(jobsTable.id, jobId), eq(jobsTable.status, "active"), or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)), or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)))).limit(1);
  if (!job) { res.status(404).json({ error: "Job is unavailable or expired" }); return; }
  try {
    const application = await db.transaction(async (tx) => {
      const [created] = await tx.insert(applicationsTable).values({ jobId, candidateId: candidate.id, coverLetter: parsed.data.coverLetter }).returning();
      await tx.insert(applicationStatusHistoryTable).values({ applicationId: created.id, status: "Application Received", changedByClerkUserId: req.candidateClerkUserId! });
      await tx.update(jobsTable).set({ applyCount: sql`${jobsTable.applyCount} + 1` }).where(eq(jobsTable.id, jobId));
      return created;
    });
    res.status(201).json(application);
  } catch (error: any) {
    if (error?.code === "23505") { res.status(409).json({ error: "You have already applied for this job" }); return; }
    throw error;
  }
});
router.get("/jobs/:id/application-status", requireCandidate, async (req, res) => {
  const params = GetCandidateJobApplicationStatusParams.safeParse(req.params);
  if (!params.success || !Number.isInteger(params.data.id)) { res.status(400).json({ error: "Invalid job ID" }); return; }
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable)
    .where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.json(GetCandidateJobApplicationStatusResponse.parse({ applied: false })); return; }
  const [application] = await db.select({ id: applicationsTable.id, status: applicationsTable.status }).from(applicationsTable)
    .where(and(eq(applicationsTable.candidateId, candidate.id), eq(applicationsTable.jobId, params.data.id))).limit(1);
  res.json(GetCandidateJobApplicationStatusResponse.parse(application
    ? { applied: true, applicationId: application.id, status: application.status }
    : { applied: false }));
});
router.get("/candidate/applications", requireCandidate, async (req, res) => {
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.json([]); return; }
  // Recruiter notes and reviewer-only fields are intentionally not selected.
  const applications = await db.select({
    id: applicationsTable.id, jobId: applicationsTable.jobId, status: applicationsTable.status,
    createdAt: applicationsTable.createdAt, updatedAt: applicationsTable.updatedAt,
    receivedAt: applicationsTable.receivedAt, reviewedAt: applicationsTable.reviewedAt, shortlistedAt: applicationsTable.shortlistedAt,
    interviewAt: applicationsTable.interviewAt, offeredAt: applicationsTable.offeredAt, hiredAt: applicationsTable.hiredAt, notSelectedAt: applicationsTable.notSelectedAt,
    jobTitle: jobsTable.title, companyName: employersTable.companyName,
  }).from(applicationsTable).innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id))
    .where(eq(applicationsTable.candidateId, candidate.id)).orderBy(desc(applicationsTable.createdAt));
  res.json(applications);
});
router.get("/candidate/saved-jobs", requireCandidate, async (req, res) => {
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.status(409).json({ error: "Create a candidate profile before saving jobs" }); return; }
  const savedJobs = await db.select({ jobId: candidateSavedJobsTable.jobId }).from(candidateSavedJobsTable)
    .where(eq(candidateSavedJobsTable.candidateId, candidate.id)).orderBy(desc(candidateSavedJobsTable.createdAt));
  res.json(savedJobs.map(({ jobId }) => jobId));
});
router.put("/candidate/saved-jobs/:jobId", requireCandidate, async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.status(409).json({ error: "Create a candidate profile before saving jobs" }); return; }
  const now = new Date();
  const [job] = await db.select({ id: jobsTable.id }).from(jobsTable).where(and(eq(jobsTable.id, jobId), eq(jobsTable.status, "active"), or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)), or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)))).limit(1);
  if (!job) { res.status(404).json({ error: "Job is unavailable or expired" }); return; }
  await db.insert(candidateSavedJobsTable).values({ candidateId: candidate.id, jobId }).onConflictDoNothing();
  res.json({ jobId });
});
router.delete("/candidate/saved-jobs/:jobId", requireCandidate, async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (!Number.isInteger(jobId)) { res.status(400).json({ error: "Invalid job ID" }); return; }
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
  if (!candidate) { res.status(409).json({ error: "Create a candidate profile before saving jobs" }); return; }
  await db.delete(candidateSavedJobsTable).where(and(eq(candidateSavedJobsTable.candidateId, candidate.id), eq(candidateSavedJobsTable.jobId, jobId)));
  res.json({ success: true });
});

router.get("/recruiter/company", requireRecruiter, async (req, res) => {
  const [company] = await db.select(companyFields).from(employersTable).where(eq(employersTable.id, req.recruiter!.employerId));
  res.json(company);
});
router.post("/recruiter/register", async (req, res) => {
  const auth = getAuth(req);
  const clerkUserId = auth?.sessionClaims?.userId || auth?.userId;
  if (!clerkUserId) { res.status(401).json({ error: "A verified Clerk account is required" }); return; }
  const email = await getVerifiedEmail(String(clerkUserId), auth?.sessionClaims as Record<string, unknown> | undefined);
  if (!email) { res.status(401).json({ error: "A verified Clerk email is required" }); return; }
  const parsed = RegisterRecruiterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const clerkId = String(clerkUserId);
  const registration = {
    companyName: parsed.data.companyName.trim(),
    contactName: parsed.data.contactName.trim(),
    phone: parsed.data.phone?.trim() || undefined,
  };
  if (registration.companyName.length < 2 || registration.contactName.length < 2) {
    res.status(400).json({ error: "Company and contact names must contain at least 2 characters" });
    return;
  }

  const [alreadyLinked] = await db.select(companyFields).from(employersTable)
    .where(eq(employersTable.clerkUserId, clerkId)).limit(1);
  if (alreadyLinked) { res.json(alreadyLinked); return; }

  const [emailOwner] = await db.select({
    id: employersTable.id,
    clerkUserId: employersTable.clerkUserId,
  }).from(employersTable).where(sql`lower(${employersTable.email}) = ${email}`).limit(1);
  if (emailOwner?.clerkUserId && emailOwner.clerkUserId !== clerkId) {
    res.status(409).json({ error: "An employer account already uses this verified email. Sign in with that account instead." });
    return;
  }

  if (emailOwner) {
    const [bridged] = await db.update(employersTable).set({ clerkUserId: clerkId })
      .where(and(eq(employersTable.id, emailOwner.id), isNull(employersTable.clerkUserId)))
      .returning(companyFields);
    if (bridged) { res.json(bridged); return; }
  }

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(lower(trim(${registration.companyName}))))`,
      );
      const [companyOwner] = await tx.select({ id: employersTable.id }).from(employersTable)
        .where(sql`lower(trim(${employersTable.companyName})) = lower(${registration.companyName})`)
        .limit(1);
      if (companyOwner) return { kind: "company-conflict" } as const;

      const [created] = await tx.insert(employersTable).values({
        email,
        clerkUserId: clerkId,
        passwordHash: await bcrypt.hash(randomUUID(), 12),
        ...registration,
      }).returning(companyFields);
      return { kind: "created", company: created } as const;
    });
    if (result.kind === "company-conflict") {
      res.status(409).json({
        error: "This company already has an employer account. Ask the existing account owner for access.",
      });
      return;
    }
    res.status(201).json(result.company);
  } catch (error: any) {
    if (error?.code === "23505") {
      const [concurrentRegistration] = await db.select(companyFields).from(employersTable)
        .where(eq(employersTable.clerkUserId, clerkId)).limit(1);
      if (concurrentRegistration) { res.json(concurrentRegistration); return; }
      const [duplicateCompany] = await db.select({ id: employersTable.id }).from(employersTable)
        .where(sql`lower(trim(${employersTable.companyName})) = lower(${registration.companyName})`)
        .limit(1);
      if (duplicateCompany) {
        res.status(409).json({
          error: "This company already has an employer account. Ask the existing account owner for access.",
        });
        return;
      }
      res.status(409).json({ error: "This verified email is already linked to another employer account." });
      return;
    }
    throw error;
  }
});
router.patch("/recruiter/company", requireRecruiter, async (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }
  const [company] = await db.update(employersTable).set(parsed.data).where(eq(employersTable.id, req.recruiter!.employerId)).returning(companyFields);
  res.json(company);
});
router.get("/recruiter/dashboard", requireRecruiter, async (req, res) => {
  const employerId = req.recruiter!.employerId;
  const [summary] = await db.select({
    totalJobs: sql<number>`count(distinct ${jobsTable.id})::int`,
    activeJobs: sql<number>`count(distinct ${jobsTable.id}) filter (where ${jobsTable.status} = 'active')::int`,
    applications: sql<number>`count(${applicationsTable.id})::int`,
    newApplicants: sql<number>`count(${applicationsTable.id}) filter (where ${applicationsTable.status} in ('Application Received', 'New Applicant'))::int`,
    shortlisted: sql<number>`count(${applicationsTable.id}) filter (where ${applicationsTable.status} = 'Shortlisted')::int`,
    interview: sql<number>`count(${applicationsTable.id}) filter (where ${applicationsTable.status} = 'Interview')::int`,
    hired: sql<number>`count(${applicationsTable.id}) filter (where ${applicationsTable.status} = 'Hired')::int`,
  }).from(jobsTable).leftJoin(applicationsTable, eq(applicationsTable.jobId, jobsTable.id)).where(eq(jobsTable.employerId, employerId));
  res.json(summary);
});
router.get("/recruiter/applications", requireRecruiter, async (req, res) => {
  const applications = await db.select({
    id: applicationsTable.id, jobId: jobsTable.id, jobTitle: jobsTable.title, status: applicationsTable.status,
    coverLetter: applicationsTable.coverLetter, createdAt: applicationsTable.createdAt, candidateId: candidatesTable.id,
    candidateName: candidatesTable.fullName, candidateHeadline: candidatesTable.headline,
    candidateCurrentEmployer: candidatesTable.currentEmployer,
    candidateTotalHospitalityExperience: candidatesTable.totalHospitalityExperience,
    candidateTotalResortExperience: candidatesTable.totalResortExperience,
    candidateMaldivesExperience: candidatesTable.maldivesExperience,
    candidateAvailability: candidatesTable.availability,
    candidateEmploymentStatus: candidatesTable.employmentStatus,
    candidateNoticePeriod: candidatesTable.noticePeriod,
    candidateCurrentlyInMaldives: candidatesTable.currentlyInMaldives,
    candidateJobsMvReviewed: candidatesTable.jobsMvReviewed,
    candidateReviewedAt: candidatesTable.reviewedAt,
  }).from(applicationsTable).innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .where(eq(jobsTable.employerId, req.recruiter!.employerId)).orderBy(desc(applicationsTable.createdAt));
  res.json(applications);
});
router.get("/recruiter/talent", requireRecruiter, async (req, res) => {
  const parsed = SearchRecruiterTalentQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid search filters", details: parsed.error.issues }); return; }
  const employerId = req.recruiter!.employerId;
  const savedExpression = sql<boolean>`exists (
    select 1 from ${employerSavedCandidatesTable}
    where ${employerSavedCandidatesTable.employerId} = ${employerId}
      and ${employerSavedCandidatesTable.candidateId} = ${candidatesTable.id}
  )`;
  const filters = parsed.data;
  const conditions = [eq(candidatesTable.openToOpportunities, true)];
  if (filters.role) conditions.push(or(ilike(candidatesTable.desiredPosition, `%${filters.role}%`), ilike(candidatesTable.headline, `%${filters.role}%`))!);
  if (filters.department) conditions.push(ilike(candidatesTable.department, `%${filters.department}%`));
  if (filters.skills) conditions.push(or(ilike(candidatesTable.hospitalitySpecialties, `%${filters.skills}%`), ilike(candidatesTable.roleSpecificSkills, `%${filters.skills}%`), ilike(candidatesTable.technicalSkills, `%${filters.skills}%`), ilike(candidatesTable.posSystems, `%${filters.skills}%`))!);
  if (filters.hospitalityExperience) conditions.push(or(ilike(candidatesTable.yearsExperience, `%${filters.hospitalityExperience}%`), ilike(candidatesTable.totalHospitalityExperience, `%${filters.hospitalityExperience}%`), ilike(candidatesTable.totalResortExperience, `%${filters.hospitalityExperience}%`))!);
  if (filters.maldivesExperience) conditions.push(ilike(candidatesTable.maldivesExperience, `%${filters.maldivesExperience}%`));
  if (filters.location) conditions.push(ilike(candidatesTable.location, `%${filters.location}%`));
  if (filters.availability) conditions.push(or(ilike(candidatesTable.availability, `%${filters.availability}%`), ilike(candidatesTable.availabilityStatus, `%${filters.availability}%`), ilike(candidatesTable.employmentStatus, `%${filters.availability}%`), ilike(candidatesTable.noticePeriod, `%${filters.availability}%`))!);
  if (filters.language) conditions.push(or(ilike(candidatesTable.languages, `%${filters.language}%`), sql`${candidatesTable.languageProficiencies}::text ilike ${`%${filters.language}%`}`)!);
  const candidates = await db.select({
    id: candidatesTable.id, fullName: candidatesTable.fullName, location: candidatesTable.location,
    headline: candidatesTable.headline, desiredPosition: candidatesTable.desiredPosition, department: candidatesTable.department,
    yearsExperience: candidatesTable.yearsExperience, hospitalitySpecialties: candidatesTable.hospitalitySpecialties,
    languages: candidatesTable.languages, availability: candidatesTable.availability, availabilityStatus: candidatesTable.availabilityStatus,
    totalHospitalityExperience: candidatesTable.totalHospitalityExperience, totalResortExperience: candidatesTable.totalResortExperience,
    maldivesExperience: candidatesTable.maldivesExperience, luxuryResortExperience: candidatesTable.luxuryResortExperience,
    roleSpecificSkills: candidatesTable.roleSpecificSkills, technicalSkills: candidatesTable.technicalSkills,
    posSystems: candidatesTable.posSystems, leadershipExperience: candidatesTable.leadershipExperience,
    employmentStatus: candidatesTable.employmentStatus, noticePeriod: candidatesTable.noticePeriod,
    availableFrom: candidatesTable.availableFrom, currentlyInMaldives: candidatesTable.currentlyInMaldives,
    profilePhotoUrl: candidatesTable.profilePhotoUrl, saved: savedExpression,
  }).from(candidatesTable).where(and(...conditions)).orderBy(desc(candidatesTable.updatedAt)).limit(100);
  res.json(SearchRecruiterTalentResponse.parse(candidates));
});
router.get("/recruiter/talent/:id", requireRecruiter, async (req, res) => {
  const params = GetRecruiterTalentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  const employerId = req.recruiter!.employerId;
  const savedExpression = sql<boolean>`exists (
    select 1 from ${employerSavedCandidatesTable}
    where ${employerSavedCandidatesTable.employerId} = ${employerId}
      and ${employerSavedCandidatesTable.candidateId} = ${candidatesTable.id}
  )`;
  const [candidate] = await db.select({
    id: candidatesTable.id, fullName: candidatesTable.fullName, location: candidatesTable.location, headline: candidatesTable.headline,
    desiredPosition: candidatesTable.desiredPosition, department: candidatesTable.department, yearsExperience: candidatesTable.yearsExperience,
    hospitalitySpecialties: candidatesTable.hospitalitySpecialties, languages: candidatesTable.languages, availability: candidatesTable.availability,
    availabilityStatus: candidatesTable.availabilityStatus, totalHospitalityExperience: candidatesTable.totalHospitalityExperience,
    totalResortExperience: candidatesTable.totalResortExperience, maldivesExperience: candidatesTable.maldivesExperience,
    luxuryResortExperience: candidatesTable.luxuryResortExperience, roleSpecificSkills: candidatesTable.roleSpecificSkills,
    technicalSkills: candidatesTable.technicalSkills, posSystems: candidatesTable.posSystems, leadershipExperience: candidatesTable.leadershipExperience,
    employmentStatus: candidatesTable.employmentStatus, noticePeriod: candidatesTable.noticePeriod, availableFrom: candidatesTable.availableFrom,
    currentlyInMaldives: candidatesTable.currentlyInMaldives, profilePhotoUrl: candidatesTable.profilePhotoUrl, education: candidatesTable.education,
    professionalCertifications: candidatesTable.professionalCertifications, hospitalityCertifications: candidatesTable.hospitalityCertifications,
    languageProficiencies: candidatesTable.languageProficiencies, saved: savedExpression,
  }).from(candidatesTable).where(and(eq(candidatesTable.id, params.data.id), eq(candidatesTable.openToOpportunities, true))).limit(1);
  if (!candidate) { res.status(404).json({ error: "Candidate not found or no longer available" }); return; }
  res.json(GetRecruiterTalentResponse.parse(candidate));
});
router.put("/recruiter/talent/:id/saved", requireRecruiter, async (req, res) => {
  const params = SaveRecruiterTalentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  const employerId = req.recruiter!.employerId;
  const saved = await db.transaction(async (tx) => {
    const [candidate] = await tx.select({ id: candidatesTable.id }).from(candidatesTable)
      .where(and(eq(candidatesTable.id, params.data.id), eq(candidatesTable.openToOpportunities, true))).limit(1).for("update");
    if (!candidate) return undefined;
    await tx.insert(employerSavedCandidatesTable).values({ employerId, candidateId: candidate.id }).onConflictDoNothing();
    const [record] = await tx.select().from(employerSavedCandidatesTable)
      .where(and(eq(employerSavedCandidatesTable.employerId, employerId), eq(employerSavedCandidatesTable.candidateId, candidate.id))).limit(1);
    return record;
  });
  if (!saved) { res.status(404).json({ error: "Candidate not found or no longer available" }); return; }
  res.json(SaveRecruiterTalentResponse.parse(saved));
});
router.delete("/recruiter/talent/:id/saved", requireRecruiter, async (req, res) => {
  const params = DeleteRecruiterTalentSavedParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  const [candidate] = await db.select({ id: candidatesTable.id }).from(candidatesTable)
    .where(and(eq(candidatesTable.id, params.data.id), eq(candidatesTable.openToOpportunities, true))).limit(1);
  if (!candidate) { res.status(404).json({ error: "Candidate not found or no longer available" }); return; }
  await db.delete(employerSavedCandidatesTable).where(and(eq(employerSavedCandidatesTable.employerId, req.recruiter!.employerId), eq(employerSavedCandidatesTable.candidateId, candidate.id)));
  res.json(DeleteRecruiterTalentSavedResponse.parse({ success: true }));
});
router.post("/recruiter/talent/:id/invitations", requireRecruiter, async (req, res) => {
  const params = InviteRecruiterTalentParams.safeParse(req.params); const body = InviteRecruiterTalentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid invitation input" }); return; }
  const employerId = req.recruiter!.employerId;
  const result = await db.transaction(async (tx) => {
    const [candidate] = await tx.select({ id: candidatesTable.id }).from(candidatesTable)
      .where(and(eq(candidatesTable.id, params.data.id), eq(candidatesTable.openToOpportunities, true))).limit(1).for("update");
    if (!candidate) return { kind: "candidate-unavailable" } as const;
    const now = new Date();
    const [job] = await tx.select({ id: jobsTable.id }).from(jobsTable).where(and(
      eq(jobsTable.id, body.data.jobId),
      eq(jobsTable.employerId, employerId),
      eq(jobsTable.status, "active"),
      or(isNull(jobsTable.expiresAt), gt(jobsTable.expiresAt, now)),
      or(isNull(jobsTable.applicationDeadline), gt(jobsTable.applicationDeadline, now)),
    )).limit(1);
    if (!job) return { kind: "job-unavailable" } as const;
    await tx.insert(employerCandidateInvitationsTable).values({ employerId, candidateId: candidate.id, jobId: job.id, message: body.data.message }).onConflictDoNothing();
    const [invitation] = await tx.select().from(employerCandidateInvitationsTable)
      .where(and(eq(employerCandidateInvitationsTable.employerId, employerId), eq(employerCandidateInvitationsTable.candidateId, candidate.id), eq(employerCandidateInvitationsTable.jobId, job.id))).limit(1);
    return { kind: "invited", invitation } as const;
  });
  if (result.kind === "candidate-unavailable") { res.status(404).json({ error: "Candidate not found or no longer available" }); return; }
  if (result.kind === "job-unavailable") { res.status(404).json({ error: "Active job not found" }); return; }
  const invitation = result.invitation;
  res.status(201).json(inviteRecruiterTalentResponseSchema.parse(invitation));
});
router.get("/recruiter/candidates/:id", requireRecruiter, async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  const [candidate] = await db.select({ candidate: recruiterCandidateFields }).from(candidatesTable)
    .innerJoin(applicationsTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(candidatesTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId))).limit(1);
  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
  res.json(candidate.candidate);
});
router.get("/recruiter/candidates/:id/cv", requireRecruiter, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  const [candidate] = await db.select({ cvObjectPath: candidatesTable.cvObjectPath })
    .from(candidatesTable)
    .innerJoin(applicationsTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(and(eq(candidatesTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId)))
    .limit(1);
  if (!candidate?.cvObjectPath) { res.status(404).json({ error: "CV not found" }); return; }
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(candidate.cvObjectPath);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Content-Disposition", `inline; filename="${candidate.cvObjectPath.split("/").pop() || "candidate-cv"}"`);
    if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    else res.end();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) { res.status(404).json({ error: "CV not found" }); return; }
    throw error;
  }
});
router.get("/recruiter/applications/:id", requireRecruiter, async (req, res) => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid application ID" }); return; }
  const [application] = await db.select({ application: applicationsTable, candidate: recruiterCandidateFields, jobTitle: jobsTable.title })
    .from(applicationsTable).innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id)).innerJoin(candidatesTable, eq(applicationsTable.candidateId, candidatesTable.id))
    .where(and(eq(applicationsTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId)));
  if (!application) { res.status(404).json({ error: "Application not found" }); return; }
  const history = await db.select().from(applicationStatusHistoryTable).where(eq(applicationStatusHistoryTable.applicationId, id)).orderBy(desc(applicationStatusHistoryTable.createdAt));
  res.json({ ...application, history });
});
router.patch("/recruiter/applications/:id/status", requireRecruiter, async (req, res) => {
  const id = Number(req.params.id); const parsed = statusSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const result = await db.transaction(async (tx) => {
    const changedAt = new Date();
    const timestampFields: Partial<Record<typeof applicationStages[number], object>> = {
      "Reviewed": { reviewedAt: changedAt }, "Shortlisted": { shortlistedAt: changedAt }, "Interview": { interviewAt: changedAt },
      "Offered": { offeredAt: changedAt }, "Hired": { hiredAt: changedAt }, "Not Selected": { notSelectedAt: changedAt },
    };
    const timestampField = timestampFields[parsed.data.status] ?? {};
    const [updated] = await tx.update(applicationsTable).set({ status: parsed.data.status, updatedAt: changedAt, ...timestampField })
      .where(and(eq(applicationsTable.id, id), sql`exists (select 1 from ${jobsTable} where ${jobsTable.id} = ${applicationsTable.jobId} and ${jobsTable.employerId} = ${req.recruiter!.employerId})`)).returning();
    if (!updated) return undefined;
    await tx.insert(applicationStatusHistoryTable).values({ applicationId: id, status: parsed.data.status, note: parsed.data.note, changedByClerkUserId: req.recruiter!.clerkUserId });
    return updated;
  });
  if (!result) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(result);
});
router.patch("/recruiter/jobs/:id/status", requireRecruiter, async (req, res) => {
  const id = Number(req.params.id); const parsed = z.object({ status: z.enum(["active", "inactive", "closed"]) }).safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [job] = await db.update(jobsTable).set({ status: parsed.data.status, updatedAt: new Date() }).where(and(eq(jobsTable.id, id), eq(jobsTable.employerId, req.recruiter!.employerId))).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; } res.json(job);
});
export default router;