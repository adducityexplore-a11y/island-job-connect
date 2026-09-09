import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";

export const applicationStages = [
  "Application Received", "Reviewed", "Shortlisted", "Interview", "Offered", "Hired", "Not Selected",
  // Legacy values remain accepted so existing applications can be read and migrated naturally.
  "New Applicant", "AI Reviewed", "Selected", "Rejected",
] as const;
export type ApplicationStage = (typeof applicationStages)[number];

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobsTable.id).notNull(),
  candidateId: integer("candidate_id").references(() => candidatesTable.id).notNull(),
  status: text("status").$type<ApplicationStage>().notNull().default("Application Received"),
  coverLetter: text("cover_letter"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  shortlistedAt: timestamp("shortlisted_at", { withTimezone: true }),
  interviewAt: timestamp("interview_at", { withTimezone: true }),
  offeredAt: timestamp("offered_at", { withTimezone: true }),
  hiredAt: timestamp("hired_at", { withTimezone: true }),
  notSelectedAt: timestamp("not_selected_at", { withTimezone: true }),
}, (table) => [uniqueIndex("applications_job_candidate_unique").on(table.jobId, table.candidateId)]);

export const applicationStatusHistoryTable = pgTable("application_status_history", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applicationsTable.id).notNull(),
  status: text("status").$type<ApplicationStage>().notNull(),
  changedByClerkUserId: text("changed_by_clerk_user_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});