---
name: Unified employer workspace
description: Durable architecture and compatibility rule for employer users and legacy recruiter access.
---

The platform has three user-facing contexts only: Candidate, Employer, and Admin. Recruiters, HR managers, hiring managers, and business owners are employer users in one Employer Workspace, not a separate Recruiter Workspace. Use managed Clerk for employer access while keeping legacy recruiter routes and login only as temporary compatibility bridges. New employer provisioning must be idempotent and derive identity from a verified Clerk account, never from submitted email.

**Why:** Employer and recruiter interfaces already share the same employer, vacancy, application, candidate, and company records. Maintaining two products creates confusion and inconsistent behavior, while deleting legacy access would strand existing employers.

**How to apply:** Build all hiring features under Employer Workspace with existing ownership checks. Redirect old recruiter URLs to employer equivalents, preserve the verified-email/account-link bridge, and remove compatibility code only after separately confirmed migration testing. Keep signed-in users without an employer record in onboarding until secure provisioning succeeds.