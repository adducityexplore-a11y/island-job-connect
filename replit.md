# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### The Jobs MV App (artifacts/mobile)
- **Type**: Expo (React Native) mobile app
- **Preview Path**: `/`
- **Purpose**: Maldives hospitality jobs platform for job seekers and employers

**Features**:
- Home screen with featured jobs carousel, department filter (12 departments), latest jobs feed
- Browse jobs screen with search + department filtering
- Job detail screen with full info, WhatsApp apply button, and Email apply button
- Candidate CV profile screen (name, phone, email, location, experience, dept, availability, salary, photo/CV placeholders) — saved to AsyncStorage
- Post a job form for employers (company info, job details, apply method, post type: Normal/Featured/Urgent)
- Career Tips screen with Interview Tips and CV Tips (expandable accordion)
- 12 sample Maldives resort job listings with real resort names and departments

**Key files**:
- `artifacts/mobile/constants/data.ts` — sample jobs + department types
- `artifacts/mobile/constants/colors.ts` — ocean-blue brand theme
- `artifacts/mobile/contexts/ProfileContext.tsx` — candidate profile state (AsyncStorage)
- `artifacts/mobile/components/JobCard.tsx` — reusable job listing card
- `artifacts/mobile/components/DepartmentFilter.tsx` — horizontal filter chips
- `artifacts/mobile/components/Badge.tsx` — Featured/Urgent badge
- `artifacts/mobile/app/(tabs)/` — Home, Jobs, Post, Profile, Tips screens
- `artifacts/mobile/app/job/[id].tsx` — Job detail screen
