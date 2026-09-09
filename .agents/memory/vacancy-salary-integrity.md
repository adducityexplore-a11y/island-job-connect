---
name: Vacancy salary integrity
description: Trust rule for capturing and displaying vacancy compensation.
---

Numeric vacancy salaries require an explicit currency and pay period. If legacy data lacks currency, hide the amount and state that the currency is unspecified rather than guessing.

**Why:** A bare number can mean materially different compensation in USD or MVR and can mislead candidates.

**How to apply:** Capture currency and period with salary values in every employer interface. Format amounts with separators and a period suffix, and honor not-disclosed status without exposing stored numbers.