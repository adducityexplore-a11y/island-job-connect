import { boolean, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { adminsTable } from "./admins";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  location: text("location"),
  headline: text("headline"),
  summary: text("summary"),
  yearsExperience: text("years_experience"),
  hospitalitySpecialties: text("hospitality_specialties"),
  languages: text("languages"),
  availability: text("availability"),
  desiredPosition: text("desired_position"),
  department: text("department"),
  expectedSalary: text("expected_salary"),
  profilePhotoUrl: text("profile_photo_url"),
  availabilityStatus: text("availability_status"),
  openToOpportunities: boolean("open_to_opportunities").notNull().default(false),
  cvObjectPath: text("cv_object_path"),
  currentEmployer: text("current_employer"),
  nationality: text("nationality"),
  totalHospitalityExperience: text("total_hospitality_experience"),
  totalResortExperience: text("total_resort_experience"),
  maldivesExperience: text("maldives_experience"),
  luxuryResortExperience: text("luxury_resort_experience"),
  roleSpecificSkills: text("role_specific_skills"),
  technicalSkills: text("technical_skills"),
  posSystems: text("pos_systems"),
  leadershipExperience: text("leadership_experience"),
  education: text("education"),
  professionalCertifications: text("professional_certifications"),
  hospitalityCertifications: text("hospitality_certifications"),
  employmentStatus: text("employment_status"),
  noticePeriod: text("notice_period"),
  availableFrom: timestamp("available_from", { withTimezone: true }),
  currentlyInMaldives: boolean("currently_in_maldives"),
  // Arrays retain individual work-history/language fields without a public profile database.
  workHistory: jsonb("work_history"),
  languageProficiencies: jsonb("language_proficiencies"),
  jobsMvReviewed: boolean("jobs_mv_reviewed").notNull().default(false),
  reviewedBy: text("reviewed_by").references(() => adminsTable.clerkUserId),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({
  id: true, clerkUserId: true, createdAt: true, updatedAt: true,
});
export type Candidate = typeof candidatesTable.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;