---
name: Candidate sourcing consent and matching
description: Durable privacy and scoring rules for Find Candidates For Me.
---

Candidate sourcing requires active “Open to Opportunities” consent. Turning it off is a withdrawal: existing sourcing assignments and recruitment-specific CV access must be revoked, not merely hidden from new searches.

**Why:** Candidate pool participation and CV sharing are voluntary and request-specific. Continuing to expose previously assigned profiles after opt-out would violate that expectation.

**How to apply:** Re-check active consent at search, assignment, shortlist display, employer action, and CV-download boundaries. Keep CV authorization tied to an employer-owned shortlisted request.

Consent withdrawal and new sourcing actions must serialize on the candidate record; a read-then-write consent check is not sufficient.

**Why:** Without a shared row lock, a save or invitation can be inserted immediately after an opt-out transaction deletes existing sourcing records.

**How to apply:** Hold a candidate row lock across consent verification and any sourcing association write, and across opt-out plus revocation cleanup.

“Open to Opportunities” is a separate consent choice, not a profile-completion field. Choosing OFF must never lower Hospitality Passport completion or visually pressure candidates to opt in.

**Why:** Both ON and OFF are valid, complete preferences. Treating refusal as an incomplete profile creates a coercive privacy pattern.

**How to apply:** Exclude discoverability consent from completion percentages and missing-field prompts; show its current state and consequences separately.

Automated matching may use only actual, non-protected profile and request evidence. Gender and nationality preferences must never affect a computed score.

**Why:** Matching must be explainable and must not automate discriminatory selection. Missing evidence must not be treated as a positive signal.

**How to apply:** Score only criteria requested by the vacancy, return strengths and missing evidence, keep admin judgment final, and never display fabricated or placeholder scores.

The canonical recruitment service sequence is: Vacancy → Applications → Screening → Expert Review → Interview-Ready Shortlist → Employer Interview. Position Filled and Closed are terminal outcomes.

**Why:** This is the employer-facing process the product should communicate consistently.

**How to apply:** Keep backend status ordering, admin controls, employer tracking, and future reporting aligned to these labels and sequence.