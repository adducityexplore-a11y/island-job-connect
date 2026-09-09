---
name: Vite build-time service variables
description: Build reliability rule for artifact Vite configurations.
---

Vite configurations must have build-safe defaults for service variables such as `PORT` and `BASE_PATH`; artifact runtime values still override them during development and serving.

**Why:** Repository-wide production builds load Vite configuration without service runtime environment variables. Requiring those variables at config import time breaks an otherwise valid static bundle.

**How to apply:** Use the artifact’s registered port and preview path as defaults in Vite config, while retaining validation for malformed values and allowing workflow-provided values to override them.