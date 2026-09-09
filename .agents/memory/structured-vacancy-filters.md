---
name: Structured vacancy filters
description: Data-quality rule for public vacancy filtering.
---

Public filters for experience level and local/international candidate scope must use explicit structured vacancy fields. Existing vacancies remain unspecified until an employer or admin supplies those values.

**Why:** Inferring eligibility or experience from free-text descriptions can misclassify vacancies and mislead candidates.

**How to apply:** Add new filter dimensions to vacancy creation/editing and the public API first. Never backfill unknown values with guessed defaults; filters should return only records with matching real data.