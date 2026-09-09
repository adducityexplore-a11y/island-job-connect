import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  CompleteCandidateCvUploadBody,
  CompleteCandidateCvUploadResponse,
  RequestCandidateCvUploadUrlBody,
  RequestCandidateCvUploadUrlResponse,
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { clerkClient, getAuth } from "@clerk/express";
import { adminsTable, applicationsTable, candidatesTable, db, employersTable, jobsTable, recruitmentAssignmentsTable, recruitmentRequestsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireCandidate } from "../middleware/recruiterAuth.js";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const CV_UPLOAD_TTL_MS = 10 * 60 * 1000;
const allowedCvContentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

async function findOrCreateCandidateForCv(clerkUserId: string) {
  const [existing] = await db.select({ id: candidatesTable.id }).from(candidatesTable)
    .where(eq(candidatesTable.clerkUserId, clerkUserId)).limit(1);
  if (existing) return existing;

  const user = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId && address.verification?.status === "verified",
  )?.emailAddress.toLowerCase();
  if (!primaryEmail) return undefined;

  const clerkName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const [created] = await db.insert(candidatesTable).values({
    clerkUserId,
    email: primaryEmail,
    fullName: clerkName || primaryEmail.split("@")[0],
    openToOpportunities: false,
  }).onConflictDoNothing().returning({ id: candidatesTable.id });
  if (created) return created;

  // A concurrent request may have created the same candidate first.
  return (await db.select({ id: candidatesTable.id }).from(candidatesTable)
    .where(eq(candidatesTable.clerkUserId, clerkUserId)).limit(1))[0];
}

type CvUploadTokenPayload = {
  candidateId: number;
  clerkUserId: string;
  objectPath: string;
  size: number;
  contentType: string;
  expiresAt: number;
};

function cvTokenKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for candidate CV uploads");
  return createHash("sha256").update(secret).digest();
}

function createCvUploadToken(payload: CvUploadTokenPayload): string {
  const key = cvTokenKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const signed = `${iv.toString("base64url")}.${encrypted.toString("base64url")}.${tag.toString("base64url")}`;
  const signature = createHmac("sha256", key).update(signed).digest("base64url");
  return `${signed}.${signature}`;
}

function readCvUploadToken(token: string): CvUploadTokenPayload | undefined {
  try {
    const [ivPart, ciphertextPart, tagPart, signaturePart, ...extra] = token.split(".");
    if (!ivPart || !ciphertextPart || !tagPart || !signaturePart || extra.length) return undefined;
    const key = cvTokenKey();
    const signed = `${ivPart}.${ciphertextPart}.${tagPart}`;
    const expectedSignature = createHmac("sha256", key).update(signed).digest();
    const suppliedSignature = Buffer.from(signaturePart, "base64url");
    if (suppliedSignature.length !== expectedSignature.length || !timingSafeEqual(suppliedSignature, expectedSignature)) return undefined;
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const payload = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, "base64url")),
      decipher.final(),
    ]).toString("utf8")) as CvUploadTokenPayload;
    if (
      !Number.isInteger(payload.candidateId) ||
      typeof payload.clerkUserId !== "string" ||
      !payload.objectPath.startsWith("/objects/") ||
      !Number.isInteger(payload.size) ||
      !allowedCvContentTypes.has(payload.contentType) ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt < Date.now()
    ) return undefined;
    return payload;
  } catch {
    return undefined;
  }
}

async function streamPrivateCv(req: Request, res: Response, candidate: { id: number; clerkUserId: string; cvObjectPath: string | null }, allowOwner = false, recruitmentOnly = false) {
  if (!candidate.cvObjectPath) { res.status(404).json({ error: "CV not found" }); return; }
  const clerkUserId = getAuth(req).userId;
  if (!clerkUserId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [admin] = await db.select({ id: adminsTable.id }).from(adminsTable).where(and(eq(adminsTable.clerkUserId, clerkUserId), eq(adminsTable.active, true))).limit(1);
  const [applicationAccess] = await db.select({ id: applicationsTable.id }).from(applicationsTable).innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id)).innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id)).where(and(eq(applicationsTable.candidateId, candidate.id), eq(employersTable.clerkUserId, clerkUserId))).limit(1);
  const [shortlistAccess] = await db.select({ id: recruitmentAssignmentsTable.id }).from(recruitmentAssignmentsTable).innerJoin(recruitmentRequestsTable, eq(recruitmentAssignmentsTable.requestId, recruitmentRequestsTable.id)).innerJoin(employersTable, eq(recruitmentRequestsTable.employerId, employersTable.id)).where(and(eq(recruitmentAssignmentsTable.candidateId, candidate.id), eq(recruitmentAssignmentsTable.decision, "Shortlisted"), eq(employersTable.clerkUserId, clerkUserId))).limit(1);
  if ((!allowOwner || candidate.clerkUserId !== clerkUserId) && !admin && !(recruitmentOnly ? shortlistAccess : applicationAccess || shortlistAccess)) { res.status(403).json({ error: "Forbidden" }); return; }
  const file = await objectStorageService.getObjectEntityFile(candidate.cvObjectPath);
  const response = await objectStorageService.downloadObject(file);
  res.status(response.status); response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res); else res.end();
}

router.get("/storage/recruitment-cv/:candidateId", async (req: Request, res: Response) => {
  const candidateId = Number(req.params.candidateId);
  if (!Number.isInteger(candidateId)) { res.status(400).json({ error: "Invalid candidate ID" }); return; }
  try {
    const [candidate] = await db.select({ id: candidatesTable.id, clerkUserId: candidatesTable.clerkUserId, cvObjectPath: candidatesTable.cvObjectPath }).from(candidatesTable).where(and(eq(candidatesTable.id, candidateId), eq(candidatesTable.openToOpportunities, true))).limit(1);
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
    await streamPrivateCv(req, res, candidate, false, true);
  } catch (error) { req.log.error({ err: error }, "Recruitment CV serving failed"); if (!res.headersSent) res.status(500).json({ error: "Failed to serve CV" }); }
});

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * Creates a private, candidate-owned CV upload target. The generated object
 * path is never returned to the browser and cannot be supplied through a
 * profile update.
 */
router.post("/candidate/cv/upload-url", requireCandidate, async (req: Request, res: Response) => {
  const parsed = RequestCandidateCvUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "CV must be a PDF, DOC, or DOCX file no larger than 10 MB", details: parsed.error.issues });
    return;
  }
  const candidate = await findOrCreateCandidateForCv(req.candidateClerkUserId!);
  if (!candidate) {
    res.status(409).json({ error: "Verify your account email before uploading a CV" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const cvObjectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    const expiresAt = new Date(Date.now() + CV_UPLOAD_TTL_MS);
    const uploadToken = createCvUploadToken({
      candidateId: candidate.id,
      clerkUserId: req.candidateClerkUserId!,
      objectPath: cvObjectPath,
      size: parsed.data.size,
      contentType: parsed.data.contentType,
      expiresAt: expiresAt.getTime(),
    });
    res.json(RequestCandidateCvUploadUrlResponse.parse({ uploadURL, uploadToken, expiresAt }));
  } catch (error) {
    req.log.error({ err: error }, "Candidate CV upload URL generation failed");
    res.status(500).json({ error: "Failed to prepare CV upload" });
  }
});

router.post("/candidate/cv/complete", requireCandidate, async (req: Request, res: Response) => {
  const parsed = CompleteCandidateCvUploadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid upload token" }); return; }
  const payload = readCvUploadToken(parsed.data.uploadToken);
  if (!payload || payload.clerkUserId !== req.candidateClerkUserId!) {
    res.status(400).json({ error: "Upload token is invalid or expired" });
    return;
  }
  let file;
  try {
    file = await objectStorageService.getObjectEntityFile(payload.objectPath);
    const [metadata] = await file.getMetadata();
    const validFile = Number(metadata.size) === payload.size
      && allowedCvContentTypes.has(String(metadata.contentType))
      && metadata.contentType === payload.contentType
      && payload.size <= 10 * 1024 * 1024;
    if (!validFile) {
      await file.delete({ ignoreNotFound: true });
      res.status(400).json({ error: "Uploaded CV did not match the approved file type or size" });
      return;
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) { res.status(404).json({ error: "Uploaded CV not found" }); return; }
    req.log.error({ err: error }, "Candidate CV upload verification failed");
    res.status(500).json({ error: "Failed to verify uploaded CV" });
    return;
  }
  const [candidate] = await db.update(candidatesTable)
    .set({ cvObjectPath: payload.objectPath, updatedAt: new Date() })
    .where(and(eq(candidatesTable.id, payload.candidateId), eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)))
    .returning({ id: candidatesTable.id });
  if (!candidate) { res.status(404).json({ error: "Candidate profile not found" }); return; }
  res.json(CompleteCandidateCvUploadResponse.parse({ cvAvailable: true }));
});

router.get("/candidate/cv", requireCandidate, async (req: Request, res: Response) => {
  try {
    const [candidate] = await db.select({
      id: candidatesTable.id,
      clerkUserId: candidatesTable.clerkUserId,
      cvObjectPath: candidatesTable.cvObjectPath,
    }).from(candidatesTable).where(eq(candidatesTable.clerkUserId, req.candidateClerkUserId!)).limit(1);
    if (!candidate) { res.status(404).json({ error: "CV not found" }); return; }
    await streamPrivateCv(req, res, candidate, true);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) { res.status(404).json({ error: "CV not found" }); return; }
    req.log.error({ err: error }, "Candidate CV serving failed");
    if (!res.headersSent) res.status(500).json({ error: "Failed to serve CV" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const clerkUserId = getAuth(req).userId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const [candidate] = await db.select({
      id: candidatesTable.id, clerkUserId: candidatesTable.clerkUserId,
    }).from(candidatesTable).where(eq(candidatesTable.cvObjectPath, objectPath)).limit(1);
    if (!candidate) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [admin] = await db.select({ id: adminsTable.id }).from(adminsTable)
      .where(and(eq(adminsTable.clerkUserId, clerkUserId), eq(adminsTable.active, true))).limit(1);
    const [recruiterAccess] = await db.select({ id: applicationsTable.id }).from(applicationsTable)
      .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
      .innerJoin(employersTable, eq(jobsTable.employerId, employersTable.id))
      .where(and(
        eq(applicationsTable.candidateId, candidate.id),
        eq(employersTable.clerkUserId, clerkUserId),
      )).limit(1);
    if (candidate.clerkUserId !== clerkUserId && !recruiterAccess && !admin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ event: "authorized_object_not_found" }, "Authorized object was not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ event: "protected_object_serving_failed" }, "Error serving protected object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
