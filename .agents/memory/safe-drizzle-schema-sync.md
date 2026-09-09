---
name: Safe Drizzle schema sync
description: How to treat interactive Drizzle schema pushes that encounter data-preservation prompts.
---

Do not assume an interactive schema-push command applied changes merely because it exited successfully. When it displays a truncation or constraint prompt without receiving an answer, verify the expected columns in `information_schema` before testing the app.

**Why:** In this Replit environment, a non-interactive push reached a safety prompt, exited with code zero, and left all additive columns unapplied. The API then failed at runtime on its first query of a missing column.

**How to apply:** Prefer the explicit non-truncating choice when interaction is available. If the prompt cannot be answered safely, apply only the reviewed additive DDL through the database tooling, then verify the schema and a live API query. Never use force when it could truncate existing data.