---
name: Live API code generation
description: Preventing Metro preview crashes when regenerating the shared API client.
---

Keep Orval generation non-destructive while the Expo development workflow is running; do not clean the generated output directories before rewriting modules.

**Why:** Metro watches the shared generated client. Removing that directory, even briefly, causes missing-module runtime crashes and can leave the artifact marked as crashed despite successful regeneration.

**How to apply:** Preserve generated files during normal code generation. If obsolete generated modules ever need cleanup, stop the consuming workflows first, clean and regenerate, then restart them.