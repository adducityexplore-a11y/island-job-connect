import { check, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { employersTable } from "./employers";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id")
    .references(() => employersTable.id)
    .notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  experienceLevel: text("experience_level"),
  candidateScope: text("candidate_scope"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  // These stay nullable so legacy salary amounts remain explicitly unknown.
  salaryCurrency: text("salary_currency").$type<"USD" | "MVR">(),
  salaryPeriod: text("salary_period").$type<"month">(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  type: text("type").notNull().default("Normal"),
  applyMethod: text("apply_method").notNull().default("whatsapp"),
  applyContact: text("apply_contact").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("active"),
  viewCount: integer("view_count").notNull().default(0),
  applyCount: integer("apply_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  // Provenance and freshness are editorial fields; they are deliberately optional
  // so existing vacancies retain their current behaviour.
  source: text("source"),
  originalSourceUrl: text("original_source_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  salaryDisclosure: text("salary_disclosure").notNull().default("not_provided"),
  serviceCharge: text("service_charge"),
  serviceChargeDisclosure: text("service_charge_disclosure").notNull().default("not_provided"),
  otherAllowances: text("other_allowances"),
  otherAllowancesDisclosure: text("other_allowances_disclosure").notNull().default("not_provided"),
  overtime: text("overtime"),
  overtimeDisclosure: text("overtime_disclosure").notNull().default("not_provided"),
  accommodation: text("accommodation"),
  accommodationDisclosure: text("accommodation_disclosure").notNull().default("not_provided"),
  meals: text("meals"),
  mealsDisclosure: text("meals_disclosure").notNull().default("not_provided"),
  healthInsurance: text("health_insurance"),
  healthInsuranceDisclosure: text("health_insurance_disclosure").notNull().default("not_provided"),
  annualLeave: text("annual_leave"),
  annualLeaveDisclosure: text("annual_leave_disclosure").notNull().default("not_provided"),
  airTicket: text("air_ticket"),
  airTicketDisclosure: text("air_ticket_disclosure").notNull().default("not_provided"),
  workingHours: text("working_hours"),
  workingHoursDisclosure: text("working_hours_disclosure").notNull().default("not_provided"),
  weeklyOff: text("weekly_off"),
  weeklyOffDisclosure: text("weekly_off_disclosure").notNull().default("not_provided"),
  probation: text("probation"),
  probationDisclosure: text("probation_disclosure").notNull().default("not_provided"),
  contractLength: text("contract_length"),
  contractLengthDisclosure: text("contract_length_disclosure").notNull().default("not_provided"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  check("jobs_salary_currency_allowed", sql`${table.salaryCurrency} is null or ${table.salaryCurrency} in ('USD', 'MVR')`),
  check("jobs_salary_period_allowed", sql`${table.salaryPeriod} is null or ${table.salaryPeriod} = 'month'`),
]);

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  employerId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateJobSchema = insertJobSchema.partial();

export type InsertJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
