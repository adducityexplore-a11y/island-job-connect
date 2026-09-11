import { Router } from "express";
import { and, desc, eq, ilike, isNotNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { adminAuditLogsTable, aiScreeningCategories, applicationsTable, candidatesTable, db, jobsTable, recruitmentAdminNotesTable, recruitmentAssignmentsTable, recruitmentDecisions, recruitmentRequestStatuses, recruitmentRequestsTable, recruitmentRequestStatusHistoryTable } from "@workspace/db";
import { requireAdmin } from "../middleware/adminAuth.js";
import { requireRecruiter } from "../middleware/recruiterAuth.js";

const router = Router();
const requestBody = z.object({
  companyPropertyName: z.string().min(2), positionTitle: z.string().min(2), department: z.string().min(2),
  employeesRequired: z.coerce.number().int().positive(), hiringScope: z.enum(["Local", "International", "Both"]),
  minimumExperience: z.string().max(500).optional(), preferredExperience: z.string().max(500).optional(), salary: z.string().max(200).optional(), serviceCharge: z.string().max(200).optional(),
  accommodationProvided: z.boolean().optional(), foodProvided: z.boolean().optional(), joiningDate: z.coerce.date().optional(),
  urgency: z.enum(["Normal", "Urgent"]).default("Normal"), englishLevel: z.string().max(100).optional(), educationRequirement: z.string().max(500).optional(),
  genderPreference: z.string().max(100).optional(), nationalityPreference: z.string().max(100).optional(), additionalRequirements: z.string().max(5000).optional(), jobDescription: z.string().max(10000).optional(),
  contactPerson: z.string().min(2), contactEmail: z.string().email(), contactNumber: z.string().min(3),
});
const id = (value: string | string[]) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && Number.isInteger(Number(raw)) ? Number(raw) : undefined;
};
const candidateFields = {
  id: candidatesTable.id, fullName: candidatesTable.fullName, phone: candidatesTable.phone, email: candidatesTable.email,
  location: candidatesTable.location, headline: candidatesTable.headline, desiredPosition: candidatesTable.desiredPosition,
  department: candidatesTable.department, yearsExperience: candidatesTable.yearsExperience, maldivesExperience: candidatesTable.maldivesExperience,
  availabilityStatus: candidatesTable.availabilityStatus, availability: candidatesTable.availability, expectedSalary: candidatesTable.expectedSalary,
  nationality: candidatesTable.nationality, education: candidatesTable.education, languages: candidatesTable.languages, profilePhotoUrl: candidatesTable.profilePhotoUrl,
};
function publicCandidate(candidate: typeof candidatesTable.$inferSelect) {
  return {
    id: candidate.id, fullName: candidate.fullName, phone: candidate.phone, email: candidate.email, location: candidate.location,
    headline: candidate.headline, desiredPosition: candidate.desiredPosition, department: candidate.department, yearsExperience: candidate.yearsExperience,
    maldivesExperience: candidate.maldivesExperience, availabilityStatus: candidate.availabilityStatus, availability: candidate.availability,
    expectedSalary: candidate.expectedSalary, nationality: candidate.nationality, education: candidate.education, languages: candidate.languages,
    profilePhotoUrl: candidate.profilePhotoUrl,
  };
}
function number(value: string | null): number | undefined { const match = value?.match(/\d+(\.\d+)?/); return match ? Number(match[0]) : undefined; }
function same(a: string | null, b: string | null | undefined) { return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase(); }
/** Stable, explainable score using only request-side requirements and non-protected candidate data. */
function match(request: typeof recruitmentRequestsTable.$inferSelect, candidate: typeof candidatesTable.$inferSelect) {
  const criteria: Array<{ criterion: string; weight: number; matched: boolean; evidence: string | null }> = [];
  criteria.push({ criterion: "position", weight: 30, matched: same(candidate.desiredPosition ?? candidate.headline, request.positionTitle), evidence: candidate.desiredPosition ?? candidate.headline });
  criteria.push({ criterion: "department", weight: 20, matched: same(candidate.department, request.department), evidence: candidate.department });
  const minExp = number(request.minimumExperience), experience = number(candidate.yearsExperience);
  if (minExp !== undefined) criteria.push({ criterion: "minimum experience", weight: 20, matched: experience !== undefined && experience >= minExp, evidence: candidate.yearsExperience });
  const preferredExp = number(request.preferredExperience);
  if (preferredExp !== undefined) criteria.push({ criterion: "preferred experience", weight: 10, matched: experience !== undefined && experience >= preferredExp, evidence: candidate.yearsExperience });
  const asksMaldives = /maldives|resort/i.test([request.preferredExperience, request.additionalRequirements, request.jobDescription].filter(Boolean).join(" "));
  if (asksMaldives) criteria.push({ criterion: "Maldives resort experience", weight: 10, matched: !!candidate.maldivesExperience && (number(candidate.maldivesExperience) !== undefined ? number(candidate.maldivesExperience)! > 0 : /yes|true/i.test(candidate.maldivesExperience)), evidence: candidate.maldivesExperience });
  if (request.joiningDate) criteria.push({ criterion: "availability for joining date", weight: 10, matched: candidate.availabilityStatus !== null && candidate.availabilityStatus !== "Not Looking" && (!candidate.availableFrom || candidate.availableFrom <= request.joiningDate), evidence: candidate.availabilityStatus });
  const salary = number(request.salary), expected = number(candidate.expectedSalary);
  if (salary !== undefined) criteria.push({ criterion: "salary expectation", weight: 10, matched: expected !== undefined && expected <= salary, evidence: candidate.expectedSalary });
  if (request.hiringScope !== "International") criteria.push({ criterion: "local availability", weight: 10, matched: !!candidate.location && /maldives/i.test(candidate.location), evidence: candidate.location });
  const denominator = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  const score = denominator ? Math.round(criteria.filter((criterion) => criterion.matched).reduce((total, criterion) => total + criterion.weight, 0) * 100 / denominator) : null;
  return { score, criteria, strengths: criteria.filter((criterion) => criterion.matched).map((criterion) => criterion.criterion), missingEvidence: criteria.filter((criterion) => !criterion.evidence).map((criterion) => criterion.criterion), reasons: criteria.map(({ criterion, matched, evidence }) => ({ criterion, matched, evidence })) };
}
const AI_SCREENING_MODEL = "claude-sonnet-5";

/** Only the fields relevant to fit assessment — never anything used to discriminate unlawfully. */
function screeningCandidateProfile(candidate: typeof candidatesTable.$inferSelect) {
  return {
    headline: candidate.headline, summary: candidate.summary, desiredPosition: candidate.desiredPosition, department: candidate.department,
    yearsExperience: candidate.yearsExperience, totalHospitalityExperience: candidate.totalHospitalityExperience, totalResortExperience: candidate.totalResortExperience,
    maldivesExperience: candidate.maldivesExperience, luxuryResortExperience: candidate.luxuryResortExperience, currentlyInMaldives: candidate.currentlyInMaldives,
    hospitalitySpecialties: candidate.hospitalitySpecialties, roleSpecificSkills: candidate.roleSpecificSkills, technicalSkills: candidate.technicalSkills, posSystems: candidate.posSystems,
    leadershipExperience: candidate.leadershipExperience, education: candidate.education, professionalCertifications: candidate.professionalCertifications,
    hospitalityCertifications: candidate.hospitalityCertifications, languages: candidate.languages, languageProficiencies: candidate.languageProficiencies,
    availability: candidate.availability, availabilityStatus: candidate.availabilityStatus, noticePeriod: candidate.noticePeriod, availableFrom: candidate.availableFrom,
    expectedSalary: candidate.expectedSalary, workHistory: candidate.workHistory,
  };
}
function screeningJobRequirements(request: typeof recruitmentRequestsTable.$inferSelect) {
  return {
    positionTitle: request.positionTitle, department: request.department, hiringScope: request.hiringScope,
    minimumExperience: request.minimumExperience, preferredExperience: request.preferredExperience,
    salary: request.salary, serviceCharge: request.serviceCharge, accommodationProvided: request.accommodationProvided, foodProvided: request.foodProvided,
    joiningDate: request.joiningDate, englishLevel: request.englishLevel, educationRequirement: request.educationRequirement,
    additionalRequirements: request.additionalRequirements, jobDescription: request.jobDescription,
  };
}
interface AiScreeningResult {
  category: typeof aiScreeningCategories[number];
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  mandatoryConcerns: string[];
}
function parseScreeningResponse(text: string): AiScreeningResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Model response did not contain a JSON object");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!aiScreeningCategories.includes(parsed.category)) throw new Error(`Unexpected category: ${parsed.category}`);
  return {
    category: parsed.category,
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
    summary: String(parsed.summary ?? "").slice(0, 600),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 10) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 10) : [],
    mandatoryConcerns: Array.isArray(parsed.mandatoryConcerns) ? parsed.mandatoryConcerns.map(String).slice(0, 10) : [],
  };
}
/**
 * Calls Claude to assess one candidate against one vacancy's stated requirements, using only
 * structured Hospitality Passport data (no CV text extraction exists in this codebase).
 * This never runs automatically — only on an explicit admin "Run Screening" action.
 */
async function runAiScreening(
  request: typeof recruitmentRequestsTable.$inferSelect,
  candidate: typeof candidatesTable.$inferSelect,
): Promise<AiScreeningResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const systemPrompt = `You are a hospitality recruitment screening assistant for The Jobs MV, a Maldives hospitality jobs platform. \
Assess how well a candidate fits a vacancy's stated requirements, using ONLY the structured data provided. \
Never invent, assume, or infer facts that are not present in the data — if something is not stated, treat it as unknown and list it under "gaps", not as a strength or a concern. \
Only list something under "mandatoryConcerns" if the job requirements explicitly state it as required (e.g. a stated minimum experience, English level, education requirement, or explicit nationality/gender preference) and the candidate's data clearly fails to meet it. \
Respond with ONLY a single JSON object, no other text, matching exactly this shape: \
{"category": "Strong Alignment" | "Possible Match" | "Missing Information" | "Mandatory Concern", "score": <integer 0-100>, "summary": "<one or two sentence plain-language summary, under 400 characters>", "strengths": ["<short phrase>", ...], "gaps": ["<short phrase>", ...], "mandatoryConcerns": ["<short phrase>", ...]}. \
Use "Mandatory Concern" only when a stated requirement is clearly unmet. Use "Missing Information" when key requirements can't be evaluated due to missing candidate data. Use "Possible Match" for partial fit. Use "Strong Alignment" only for a clearly strong fit.`;

  const userPrompt = JSON.stringify({
    vacancyRequirements: screeningJobRequirements(request),
    candidateProfile: screeningCandidateProfile(candidate),
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_SCREENING_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${body.slice(0, 500)}`);
  }
  const data = await response.json() as { content: Array<{ type: string; text?: string }> };
  const text = data.content.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Anthropic response did not contain text content");
  return parseScreeningResponse(text);
}

async function ownedRequest(requestId: number, employerId: number) {
  return (await db.select().from(recruitmentRequestsTable).where(and(eq(recruitmentRequestsTable.id, requestId), eq(recruitmentRequestsTable.employerId, employerId))).limit(1))[0];
}
async function employerCounters(request: typeof recruitmentRequestsTable.$inferSelect) {
  const [assignmentCounts] = await db.select({
    assignedCandidates: sql<number>`count(*)::int`,
    shortlistedCandidates: sql<number>`count(*) filter (where ${recruitmentAssignmentsTable.decision} = 'Shortlisted')::int`,
    interviewCandidates: sql<number>`count(${recruitmentAssignmentsTable.invitedToInterviewAt})::int`,
    hiredCandidates: sql<number>`count(${recruitmentAssignmentsTable.hiredAt})::int`,
  }).from(recruitmentAssignmentsTable)
    .innerJoin(candidatesTable, and(eq(recruitmentAssignmentsTable.candidateId, candidatesTable.id), eq(candidatesTable.openToOpportunities, true)))
    .where(eq(recruitmentAssignmentsTable.requestId, request.id));
  const [applicationCounts] = request.jobId
    ? await db.select({ applicationsReceived: sql<number>`count(*)::int` }).from(applicationsTable).where(eq(applicationsTable.jobId, request.jobId))
    : [{ applicationsReceived: 0 }];
  return { ...assignmentCounts, ...applicationCounts };
}

router.post("/employer/recruitment-requests", requireRecruiter, async (req, res) => {
  const parsed = requestBody.safeParse(req.body); if (!parsed.success) return void res.status(400).json({ error: "Invalid recruitment request", details: parsed.error.issues });
  const created = await db.transaction(async (tx) => {
    const [request] = await tx.insert(recruitmentRequestsTable).values({
      ...parsed.data,
      employerId: req.recruiter!.employerId,
      urgentServiceStatus: parsed.data.urgency === "Urgent" ? "Requested" : "Not Requested",
    }).returning();
    await tx.insert(recruitmentRequestStatusHistoryTable).values({ requestId: request.id, status: request.status, changedByClerkUserId: req.recruiter!.clerkUserId, note: "Request submitted" });
    return request;
  }); res.status(201).json(created);
});
router.get("/employer/recruitment-requests", requireRecruiter, async (req, res) => {
  const requests = await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.employerId, req.recruiter!.employerId)).orderBy(desc(recruitmentRequestsTable.createdAt));
  res.json(await Promise.all(requests.map(async (request) => ({ ...request, counters: await employerCounters(request) }))));
});
router.get("/employer/recruitment-requests/:id", requireRecruiter, async (req, res) => {
  const requestId = id(req.params.id); if (!requestId) return void res.status(400).json({ error: "Invalid request ID" });
  const request = await ownedRequest(requestId, req.recruiter!.employerId); if (!request) return void res.status(404).json({ error: "Recruitment request not found" });
  const assignments = await db.select({ assignment: recruitmentAssignmentsTable, candidate: candidatesTable }).from(recruitmentAssignmentsTable).innerJoin(candidatesTable, and(eq(recruitmentAssignmentsTable.candidateId, candidatesTable.id), eq(candidatesTable.openToOpportunities, true))).where(and(eq(recruitmentAssignmentsTable.requestId, requestId), eq(recruitmentAssignmentsTable.decision, "Shortlisted")));
  res.json({
    ...request,
    counters: await employerCounters(request),
    shortlist: assignments.map(({ assignment, candidate }) => ({
      ...publicCandidate(candidate), openToOpportunities: candidate.openToOpportunities,
      decision: assignment.decision, employerAction: assignment.employerAction,
      match: match(request, candidate), cvUrl: `/api/storage/recruitment-cv/${candidate.id}`,
    })),
  });
});
router.patch("/employer/recruitment-requests/:id/urgent-service", requireRecruiter, async (req, res) => {
  const requestId = id(req.params.id);
  const parsed = z.object({ response: z.enum(["Accepted", "Declined"]) }).safeParse(req.body);
  if (!requestId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const request = await ownedRequest(requestId, req.recruiter!.employerId);
  if (!request) return void res.status(404).json({ error: "Recruitment request not found" });
  if (request.urgentServiceStatus !== "Terms Ready") return void res.status(409).json({ error: "These Urgent Hiring service details are no longer awaiting a response" });
  const now = new Date();
  const [updated] = await db.update(recruitmentRequestsTable).set({
    urgentServiceStatus: parsed.data.response,
    urgentAcceptedAt: parsed.data.response === "Accepted" ? now : null,
    urgentDeclinedAt: parsed.data.response === "Declined" ? now : null,
    updatedAt: now,
  }).where(and(
    eq(recruitmentRequestsTable.id, requestId),
    eq(recruitmentRequestsTable.urgentServiceStatus, "Terms Ready"),
  )).returning();
  if (!updated) return void res.status(409).json({ error: "These Urgent Hiring service details were already updated" });
  res.json(updated);
});
router.patch("/employer/recruitment-requests/:id/shortlist/:candidateId/action", requireRecruiter, async (req, res) => {
  const requestId = id(req.params.id), candidateId = id(req.params.candidateId); const parsed = z.object({ action: z.enum(["Invite for Interview", "Reject", "Keep for Review", "Mark Hired"]) }).safeParse(req.body);
  if (!requestId || !candidateId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  if (!await ownedRequest(requestId, req.recruiter!.employerId)) return void res.status(404).json({ error: "Recruitment request not found" });
  const updated = await db.transaction(async (tx) => {
    const now = new Date();
    const [assignment] = await tx.update(recruitmentAssignmentsTable).set({
      employerAction: parsed.data.action,
      invitedToInterviewAt: parsed.data.action === "Invite for Interview" ? sql`coalesce(${recruitmentAssignmentsTable.invitedToInterviewAt}, ${now})` : undefined,
      hiredAt: parsed.data.action === "Mark Hired" ? sql`coalesce(${recruitmentAssignmentsTable.hiredAt}, ${now})` : undefined,
      updatedAt: now,
    }).where(and(eq(recruitmentAssignmentsTable.requestId, requestId), eq(recruitmentAssignmentsTable.candidateId, candidateId), eq(recruitmentAssignmentsTable.decision, "Shortlisted"), sql`exists (select 1 from ${candidatesTable} where ${candidatesTable.id} = ${recruitmentAssignmentsTable.candidateId} and ${candidatesTable.openToOpportunities} = true)`)).returning();
    if (!assignment) return undefined;
    const status = parsed.data.action === "Mark Hired" ? "Position Filled" : parsed.data.action === "Invite for Interview" ? "Employer Interview" : undefined;
    await tx.insert(recruitmentRequestStatusHistoryTable).values({ requestId, status: status ?? "Employer action", note: parsed.data.action, changedByClerkUserId: req.recruiter!.clerkUserId });
    if (status) {
      const current = (await tx.select({ status: recruitmentRequestsTable.status }).from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0];
      if (current && current.status !== "Closed" && recruitmentRequestStatuses.indexOf(status) >= recruitmentRequestStatuses.indexOf(current.status as typeof recruitmentRequestStatuses[number])) {
        await tx.update(recruitmentRequestsTable).set({ status, updatedAt: new Date() }).where(eq(recruitmentRequestsTable.id, requestId));
      }
    }
    return assignment;
  });
  if (!updated) return void res.status(404).json({ error: "Shortlisted candidate not found" }); res.json(updated);
});

router.get("/admin/recruitment-requests", requireAdmin, async (req, res) => {
  const filters = [req.query.status ? eq(recruitmentRequestsTable.status, String(req.query.status)) : undefined, req.query.urgency ? eq(recruitmentRequestsTable.urgency, String(req.query.urgency)) : undefined, req.query.property ? ilike(recruitmentRequestsTable.companyPropertyName, `%${String(req.query.property)}%`) : undefined, req.query.department ? ilike(recruitmentRequestsTable.department, `%${String(req.query.department)}%`) : undefined, req.query.position ? ilike(recruitmentRequestsTable.positionTitle, `%${String(req.query.position)}%`) : undefined].filter(Boolean);
  res.json(await db.select().from(recruitmentRequestsTable).where(and(...filters)).orderBy(
    sql`case when ${recruitmentRequestsTable.urgentServiceStatus} in ('Requested', 'Terms Ready', 'Accepted', 'Active') then 0 else 1 end`,
    desc(recruitmentRequestsTable.createdAt),
  ));
});
router.get("/admin/recruitment-requests/urgent-metrics", requireAdmin, async (_req, res) => {
  const [metrics] = await db.select({
    requested: sql<number>`count(*)::int`,
    termsReady: sql<number>`count(${recruitmentRequestsTable.urgentTermsSentAt})::int`,
    accepted: sql<number>`count(${recruitmentRequestsTable.urgentAcceptedAt})::int`,
    active: sql<number>`count(*) filter (where ${recruitmentRequestsTable.urgentServiceStatus} = 'Active')::int`,
    fulfilled: sql<number>`count(${recruitmentRequestsTable.urgentFulfilledAt})::int`,
    declined: sql<number>`count(${recruitmentRequestsTable.urgentDeclinedAt})::int`,
    averageFulfillmentHours: sql<number | null>`round(avg(extract(epoch from (${recruitmentRequestsTable.urgentFulfilledAt} - ${recruitmentRequestsTable.urgentActivatedAt})) / 3600)::numeric, 1)::float`,
  }).from(recruitmentRequestsTable).where(and(
    eq(recruitmentRequestsTable.urgency, "Urgent"),
    ne(recruitmentRequestsTable.urgentServiceStatus, "Not Requested"),
  ));
  const [outcomes] = await db.select({
    interviews: sql<number>`count(${recruitmentAssignmentsTable.invitedToInterviewAt})::int`,
    hires: sql<number>`count(${recruitmentAssignmentsTable.hiredAt})::int`,
  }).from(recruitmentAssignmentsTable).innerJoin(recruitmentRequestsTable, and(
    eq(recruitmentAssignmentsTable.requestId, recruitmentRequestsTable.id),
    eq(recruitmentRequestsTable.urgency, "Urgent"),
    isNotNull(recruitmentRequestsTable.urgentAcceptedAt),
  ));
  res.json({
    ...metrics,
    ...outcomes,
    conversionRate: metrics.requested ? Math.round((metrics.accepted / metrics.requested) * 1000) / 10 : 0,
  });
});
router.get("/admin/recruitment-requests/:id", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id); if (!requestId) return void res.status(400).json({ error: "Invalid request ID" });
  const request = (await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0]; if (!request) return void res.status(404).json({ error: "Recruitment request not found" });
  const [counts] = await db.select({ assignedCandidates: sql<number>`count(*)::int`, suitableCandidates: sql<number>`count(*) filter (where ${recruitmentAssignmentsTable.decision} = 'Suitable')::int`, shortlistedCandidates: sql<number>`count(*) filter (where ${recruitmentAssignmentsTable.decision} = 'Shortlisted')::int`, interviewCandidates: sql<number>`count(${recruitmentAssignmentsTable.invitedToInterviewAt})::int`, hiredCandidates: sql<number>`count(${recruitmentAssignmentsTable.hiredAt})::int` }).from(recruitmentAssignmentsTable).innerJoin(candidatesTable, and(eq(recruitmentAssignmentsTable.candidateId, candidatesTable.id), eq(candidatesTable.openToOpportunities, true))).where(eq(recruitmentAssignmentsTable.requestId, requestId));
  const [applicationCounts] = request.jobId ? await db.select({ applicationsReceived: sql<number>`count(*)::int` }).from(applicationsTable).where(eq(applicationsTable.jobId, request.jobId)) : [{ applicationsReceived: 0 }];
  const history = await db.select().from(recruitmentRequestStatusHistoryTable).where(eq(recruitmentRequestStatusHistoryTable.requestId, requestId)).orderBy(desc(recruitmentRequestStatusHistoryTable.createdAt));
  const assignments = await db.select({ assignment: recruitmentAssignmentsTable, candidate: candidateFields }).from(recruitmentAssignmentsTable).innerJoin(candidatesTable, and(eq(recruitmentAssignmentsTable.candidateId, candidatesTable.id), eq(candidatesTable.openToOpportunities, true))).where(eq(recruitmentAssignmentsTable.requestId, requestId));
  const notes = await db.select().from(recruitmentAdminNotesTable).where(eq(recruitmentAdminNotesTable.requestId, requestId)).orderBy(desc(recruitmentAdminNotesTable.createdAt));
  res.json({ ...request, counters: { ...counts, ...applicationCounts }, history, assignments, notes });
});
router.patch("/admin/recruitment-requests/:id/status", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id), parsed = z.object({ status: z.enum(recruitmentRequestStatuses), note: z.string().max(1000).optional(), jobId: z.number().int().positive().nullable().optional() }).safeParse(req.body);
  if (!requestId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const updated = await db.transaction(async (tx) => { const current = (await tx.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0]; if (!current) return undefined; const order = recruitmentRequestStatuses; if (current.status === "Closed" || (parsed.data.status !== "Closed" && order.indexOf(parsed.data.status) < order.indexOf(current.status as typeof order[number]))) throw new Error("STATUS_TRANSITION"); if (parsed.data.jobId) { const job = (await tx.select({ id: jobsTable.id }).from(jobsTable).where(and(eq(jobsTable.id, parsed.data.jobId), eq(jobsTable.employerId, current.employerId))).limit(1))[0]; if (!job) throw new Error("JOB_NOT_FOUND"); } const [r] = await tx.update(recruitmentRequestsTable).set({ status: parsed.data.status, jobId: parsed.data.jobId, updatedAt: new Date() }).where(eq(recruitmentRequestsTable.id, requestId)).returning(); await tx.insert(recruitmentRequestStatusHistoryTable).values({ requestId, status: r.status, note: parsed.data.note, changedByClerkUserId: req.admin!.clerkUserId }); await tx.insert(adminAuditLogsTable).values({ adminId: req.admin!.id, action: "recruitment.status_updated", entityType: "recruitment_request", entityId: String(requestId), metadata: { status: r.status, jobId: r.jobId } }); return r; });
  if (!updated) return void res.status(404).json({ error: "Recruitment request not found" }); res.json(updated);
});
router.patch("/admin/recruitment-requests/:id/urgent-service", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id);
  const parsed = z.object({
    status: z.enum(["Terms Ready", "Active", "Fulfilled", "Declined"]),
    terms: z.string().min(10).max(2000).optional(),
  }).safeParse(req.body);
  if (!requestId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const current = (await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0];
  if (!current) return void res.status(404).json({ error: "Recruitment request not found" });
  if (current.urgency !== "Urgent") return void res.status(409).json({ error: "Urgent service is only available for Urgent Hiring requests" });
  const allowed: Record<string, string[]> = {
    Requested: ["Terms Ready", "Declined"],
    "Terms Ready": ["Declined"],
    Accepted: ["Active", "Declined"],
    Active: ["Fulfilled"],
  };
  if (!allowed[current.urgentServiceStatus]?.includes(parsed.data.status)) {
    return void res.status(409).json({ error: `Cannot move Urgent Hiring from ${current.urgentServiceStatus} to ${parsed.data.status}` });
  }
  if (parsed.data.status === "Terms Ready" && !parsed.data.terms) {
    return void res.status(400).json({ error: "Service terms are required before requesting employer confirmation" });
  }
  const now = new Date();
  const [updated] = await db.update(recruitmentRequestsTable).set({
    urgentServiceStatus: parsed.data.status,
    urgentServiceTerms: parsed.data.status === "Terms Ready" ? parsed.data.terms : current.urgentServiceTerms,
    urgentTermsSentAt: parsed.data.status === "Terms Ready" ? now : current.urgentTermsSentAt,
    urgentActivatedAt: parsed.data.status === "Active" ? now : current.urgentActivatedAt,
    urgentFulfilledAt: parsed.data.status === "Fulfilled" ? now : current.urgentFulfilledAt,
    urgentDeclinedAt: parsed.data.status === "Declined" ? now : current.urgentDeclinedAt,
    updatedAt: now,
  }).where(and(
    eq(recruitmentRequestsTable.id, requestId),
    eq(recruitmentRequestsTable.urgentServiceStatus, current.urgentServiceStatus),
  )).returning();
  if (!updated) return void res.status(409).json({ error: "Urgent Hiring service was updated by someone else; refresh and try again" });
  await db.insert(adminAuditLogsTable).values({
    adminId: req.admin!.id,
    action: "recruitment.urgent_service_updated",
    entityType: "recruitment_request",
    entityId: String(requestId),
    metadata: { status: updated.urgentServiceStatus },
  });
  res.json(updated);
});
router.get("/admin/recruitment-requests/:id/candidates", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id); if (!requestId) return void res.status(400).json({ error: "Invalid request ID" });
  const request = (await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0]; if (!request) return void res.status(404).json({ error: "Recruitment request not found" });
  const term = String(req.query.q ?? ""); const candidates = await db.select().from(candidatesTable).where(and(eq(candidatesTable.openToOpportunities, true), term ? ilike(candidatesTable.fullName, `%${term}%`) : undefined)).limit(100);
  res.json(candidates.map((candidate) => ({ profile: publicCandidate(candidate), match: match(request, candidate) })));
});
router.put("/admin/recruitment-requests/:id/candidates/:candidateId", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id), candidateId = id(req.params.candidateId); const parsed = z.object({ decision: z.enum(recruitmentDecisions).optional() }).safeParse(req.body);
  if (!requestId || !candidateId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const request = (await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0]; const candidate = (await db.select().from(candidatesTable).where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.openToOpportunities, true))).limit(1))[0];
  if (!request || !candidate) return void res.status(404).json({ error: "Request or opted-in candidate not found" });
  const [assignment] = await db.insert(recruitmentAssignmentsTable).values({ requestId, candidateId, decision: parsed.data.decision, matchScore: match(request, candidate).score, assignedByClerkUserId: req.admin!.clerkUserId }).onConflictDoUpdate({ target: [recruitmentAssignmentsTable.requestId, recruitmentAssignmentsTable.candidateId], set: { decision: parsed.data.decision, matchScore: match(request, candidate).score, updatedAt: new Date() } }).returning(); res.json(assignment);
});
router.post("/admin/recruitment-requests/:id/candidates/:candidateId/screen", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id), candidateId = id(req.params.candidateId);
  if (!requestId || !candidateId) return void res.status(400).json({ error: "Invalid input" });
  const request = (await db.select().from(recruitmentRequestsTable).where(eq(recruitmentRequestsTable.id, requestId)).limit(1))[0];
  const candidate = (await db.select().from(candidatesTable).where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.openToOpportunities, true))).limit(1))[0];
  if (!request || !candidate) return void res.status(404).json({ error: "Request or opted-in candidate not found" });

  const now = new Date();
  let update: Partial<typeof recruitmentAssignmentsTable.$inferInsert>;
  try {
    const result = await runAiScreening(request, candidate);
    update = {
      aiScreeningStatus: "completed", aiScreeningCategory: result.category, aiScreeningScore: result.score,
      aiScreeningSummary: result.summary, aiScreeningStrengths: result.strengths, aiScreeningGaps: result.gaps,
      aiScreeningMandatoryConcerns: result.mandatoryConcerns, aiScreenedAt: now, aiScreenedByClerkUserId: req.admin!.clerkUserId, aiModel: AI_SCREENING_MODEL,
    };
  } catch (error) {
    req.log.error({ event: "ai_screening_failed", requestId, candidateId, err: error }, "AI screening failed");
    update = { aiScreeningStatus: "failed", aiScreenedAt: now, aiScreenedByClerkUserId: req.admin!.clerkUserId, aiModel: AI_SCREENING_MODEL };
  }

  const [assignment] = await db.insert(recruitmentAssignmentsTable).values({
    requestId, candidateId, matchScore: match(request, candidate).score, assignedByClerkUserId: req.admin!.clerkUserId, ...update,
  }).onConflictDoUpdate({ target: [recruitmentAssignmentsTable.requestId, recruitmentAssignmentsTable.candidateId], set: { ...update, updatedAt: now } }).returning();

  await db.insert(adminAuditLogsTable).values({
    adminId: req.admin!.id, action: "recruitment.candidate_screened", entityType: "recruitment_assignment", entityId: String(assignment.id),
    metadata: { requestId, candidateId, status: update.aiScreeningStatus, category: update.aiScreeningCategory ?? null, score: update.aiScreeningScore ?? null },
  });

  if (assignment.aiScreeningStatus === "failed") return void res.status(502).json({ ...assignment, error: "AI screening failed — see assignment status" });
  res.json(assignment);
});
router.patch("/admin/recruitment-requests/:id/candidates/:candidateId/decision", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id), candidateId = id(req.params.candidateId), parsed = z.object({ decision: z.enum(recruitmentDecisions), reason: z.string().max(2000).optional() }).safeParse(req.body); if (!requestId || !candidateId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const [updated] = await db.update(recruitmentAssignmentsTable).set({ decision: parsed.data.decision, updatedAt: new Date() }).where(and(eq(recruitmentAssignmentsTable.requestId, requestId), eq(recruitmentAssignmentsTable.candidateId, candidateId), sql`exists (select 1 from ${candidatesTable} where ${candidatesTable.id} = ${recruitmentAssignmentsTable.candidateId} and ${candidatesTable.openToOpportunities} = true)`)).returning(); if (!updated) return void res.status(404).json({ error: "Assignment not found" });
  await db.insert(adminAuditLogsTable).values({
    adminId: req.admin!.id, action: "recruitment.candidate_decision_updated", entityType: "recruitment_assignment", entityId: String(updated.id),
    metadata: { requestId, candidateId, decision: parsed.data.decision, aiScreeningCategory: updated.aiScreeningCategory ?? null, aiScreeningScore: updated.aiScreeningScore ?? null, reason: parsed.data.reason ?? null },
  });
  res.json(updated);
});
router.post("/admin/recruitment-requests/:id/notes", requireAdmin, async (req, res) => {
  const requestId = id(req.params.id), parsed = z.object({ note: z.string().min(1).max(5000), candidateId: z.number().int().positive().optional() }).safeParse(req.body); if (!requestId || !parsed.success) return void res.status(400).json({ error: "Invalid input" });
  const [note] = await db.insert(recruitmentAdminNotesTable).values({ requestId, note: parsed.data.note, candidateId: parsed.data.candidateId, createdByClerkUserId: req.admin!.clerkUserId }).returning(); res.status(201).json(note);
});
export default router;