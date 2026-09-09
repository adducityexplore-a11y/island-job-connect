---
name: Web-first migration
description: Product direction and cutover guardrails for moving The Jobs MV from Expo to responsive web.
---

The Jobs MV is a mobile-first responsive web platform, not a native-app-first product. Build the dedicated web experience incrementally against the existing backend and shared API while keeping Expo operational as a compatibility fallback.

**Why:** Public vacancies need direct indexable URLs, strong search/social discovery, easy browser-based applications, and desktop-appropriate recruiter/admin workspaces. Removing Expo or taking over the root route before parity is verified would risk working flows.

**How to apply:** Migrate and verify public conversion flows first, then candidate, recruiter, and admin workflows. Keep the web artifact on its non-root preview path and do not retire Expo until the replacement is functionally verified end to end.