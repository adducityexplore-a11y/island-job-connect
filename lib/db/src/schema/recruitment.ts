import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { employersTable } from "./employers";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recruitmentRequestStatuses = ["Vacancy", "Applications", "Screening", "Expert Review", "Interview-Ready Shortlist", "Employer Interview", "Position Filled", "Closed"] as const;
export const recruitmentDecisions = ["Suitable", "Not Suitable", "Shortlisted"] as const;
export const urgentServiceStatuses = ["Not Requested", "Requested", "Terms Ready", "Accepted", "Active", "Fulfilled", "Declined"] as const;

export const recruitmentRequestsTable = pgTable("recruitment_requests", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => employersTable.id),
  jobId: integer("job_id").references(() => jobsTable.id),
  companyPropertyName: text("company_property_name").notNull(),
  positionTitle: text("position_title").notNull(),
  department: text("department").notNull(),
  employeesRequired: integer("employees_required").notNull(),
  hiringScope: text("hiring_scope").notNull(),
  minimumExperience: text("minimum_experience"),
  preferredExperience: text("preferred_experience"),
  salary: text("salary"),
  serviceCharge: text("service_charge"),
  accommodationProvided: boolean("accommodation_provided"),
  foodProvided: boolean("food_provided"),
  joiningDate: timestamp("joining_date", { withTimezone: true }),
  urgency: text("urgency").notNull().default("Normal"),
  urgentServiceStatus: text("urgent_service_status").notNull().default("Not Requested"),
  urgentServiceTerms: text("urgent_service_terms"),
  urgentTermsSentAt: timestamp("urgent_terms_sent_at", { withTimezone: true }),
  urgentAcceptedAt: timestamp("urgent_accepted_at", { withTimezone: true }),
  urgentActivatedAt: timestamp("urgent_activated_at", { withTimezone: true }),
  urgentFulfilledAt: timestamp("urgent_fulfilled_at", { withTimezone: true }),
  urgentDeclinedAt: timestamp("urgent_declined_at", { withTimezone: true }),
  englishLevel: text("english_level"),
  educationRequirement: text("education_requirement"),
  genderPreference: text("gender_preference"),
  nationalityPreference: text("nationality_preference"),
  additionalRequirements: text("additional_requirements"),
  jobDescription: text("job_description"),
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactNumber: text("contact_number").notNull(),
  status: text("status").notNull().default("Vacancy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recruitmentRequestStatusHistoryTable = pgTable("recruitment_request_status_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => recruitmentRequestsTable.id),
  status: text("status").notNull(),
  note: text("note"),
  changedByClerkUserId: text("changed_by_clerk_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recruitmentAssignmentsTable = pgTable("recruitment_assignments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => recruitmentRequestsTable.id),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id),
  decision: text("decision"),
  employerAction: text("employer_action"),
  invitedToInterviewAt: timestamp("invited_to_interview_at", { withTimezone: true }),
  hiredAt: timestamp("hired_at", { withTimezone: true }),
  matchScore: integer("match_score"),
  /** AI-assisted screening result. Never written except by an explicit admin "Run Screening" action. */
  aiScreeningStatus: text("ai_screening_status"),
  aiScreeningCategory: text("ai_screening_category"),
  aiScreeningScore: integer("ai_screening_score"),
  aiScreeningSummary: text("ai_screening_summary"),
  aiScreeningStrengths: jsonb("ai_screening_strengths").$type<string[]>(),
  aiScreeningGaps: jsonb("ai_screening_gaps").$type<string[]>(),
  aiScreeningMandatoryConcerns: jsonb("ai_screening_mandatory_concerns").$type<string[]>(),
  aiScreenedAt: timestamp("ai_screened_at", { withTimezone: true }),
  aiScreenedByClerkUserId: text("ai_screened_by_clerk_user_id"),
  aiModel: text("ai_model"),
  assignedByClerkUserId: text("assigned_by_clerk_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("recruitment_assignments_request_candidate_unique").on(table.requestId, table.candidateId)]);

export const aiScreeningCategories = ["Strong Alignment", "Possible Match", "Missing Information", "Mandatory Concern"] as const;

export const recruitmentAdminNotesTable = pgTable("recruitment_admin_notes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => recruitmentRequestsTable.id),
  candidateId: integer("candidate_id").references(() => candidatesTable.id),
  note: text("note").notNull(),
  createdByClerkUserId: text("created_by_clerk_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An employer's private shortlist; it is intentionally unrelated to candidate saved jobs. */
export const employerSavedCandidatesTable = pgTable("employer_saved_candidates", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => employersTable.id),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("employer_saved_candidates_employer_candidate_unique").on(table.employerId, table.candidateId),
]);

/** An employer's invitation to a consented candidate for one of its jobs. */
export const employerCandidateInvitationsTable = pgTable("employer_candidate_invitations", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull().references(() => employersTable.id),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id),
  jobId: integer("job_id").notNull().references(() => jobsTable.id),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("employer_candidate_invitations_employer_candidate_job_unique").on(table.employerId, table.candidateId, table.jobId),
]);

export const insertEmployerSavedCandidateSchema = createInsertSchema(employerSavedCandidatesTable).omit({
  id: true, employerId: true, createdAt: true, updatedAt: true,
});
export const insertEmployerCandidateInvitationSchema = createInsertSchema(employerCandidateInvitationsTable).omit({
  id: true, employerId: true, createdAt: true, updatedAt: true,
});
export type EmployerSavedCandidate = typeof employerSavedCandidatesTable.$inferSelect;
export type InsertEmployerSavedCandidate = z.infer<typeof insertEmployerSavedCandidateSchema>;
export type EmployerCandidateInvitation = typeof employerCandidateInvitationsTable.$inferSelect;
export type InsertEmployerCandidateInvitation = z.infer<typeof insertEmployerCandidateInvitationSchema>;