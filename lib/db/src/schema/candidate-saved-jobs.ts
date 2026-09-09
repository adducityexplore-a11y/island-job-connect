import { integer, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";

export const candidateSavedJobsTable = pgTable("candidate_saved_jobs", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidatesTable.id, { onDelete: "cascade" }).notNull(),
  jobId: integer("job_id").references(() => jobsTable.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("candidate_saved_jobs_candidate_job_unique").on(table.candidateId, table.jobId)]);

export const insertCandidateSavedJobSchema = createInsertSchema(candidateSavedJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CandidateSavedJob = typeof candidateSavedJobsTable.$inferSelect;
export type InsertCandidateSavedJob = z.infer<typeof insertCandidateSavedJobSchema>;