---
name: Notification Panel Project State
description: Architecture and feature status of the OpenHouse notification management admin panel
type: project
---

Full production-grade notification admin panel built on Next.js 16 App Router, TypeScript, TanStack Query, Redux Toolkit, Shadcn UI, Recharts, React Hook Form + Zod, Sonner, date-fns, cmdk, framer-motion.

**Why:** Redesign from a basic single-page form into a SaaS-grade platform modeled on OneSignal/CustomerIO/CleverTap.

**How to apply:** When continuing work, the architecture is feature-based under `features/`. All mock APIs are in `services/mock-api/delay.ts` using `withSimulatedLatency()`. Redux owns UI state; TanStack Query owns server state. Zero real backend — swap service internals to connect real Django/FCM APIs.

## Modules implemented (all build clean as of 2026-05-08)

| Route | Module | Status |
|---|---|---|
| /admin | Dashboard (KPI, AreaChart, FunnelChart, PieChart, recent campaigns) | ✅ |
| /admin/campaigns | Campaign History (TanStack Table, sort/filter/paginate/expand) | ✅ |
| /admin/campaigns/new | Campaign Builder (5-step stepper, RHF+Zod, mobile preview) | ✅ |
| /admin/audience | Audience Segments (segment cards, size estimates) | ✅ |
| /admin/templates | Template Library (search, category filter, clone, favorite) | ✅ |
| /admin/analytics | Analytics (Recharts area/bar/pie, platform tabs, comparison) | ✅ |
| /admin/queue | Queue Monitor (live-refresh every 5s, retry/cancel actions) | ✅ |
| /admin/test-notifications | Test Center (RHF form, failure simulation, mobile preview) | ✅ |
| /admin/settings | Settings (FCM placeholder, retry policy, rate limiting, channels) | ✅ |

## Key architecture files
- `lib/types/notification.ts` — enums + all campaign/notification types
- `lib/types/{audience,template,analytics,queue}.ts` — domain types
- `lib/schemas/campaign-schema.ts` — Zod validation (merged stepper schemas)
- `lib/constants/campaign.constants.ts` — all magic values
- `services/mock-api/delay.ts` — `withSimulatedLatency()` factory
- `store/slices/{ui,campaigns,drafts,analytics}-slice.ts` — Redux slices
- `hooks/use-{notification-campaigns,audience,templates,analytics,queue}.ts` — TanStack Query hooks
- `components/data-table/data-table.tsx` — reusable TanStack Table wrapper
- `components/shared/{stat-card,empty-state,page-header,command-palette,status-badge}.tsx`
- `components/ui/{dialog,sheet,tabs,select,tooltip,progress,switch,checkbox,popover,scroll-area,alert,command,form,sonner,skeleton,separator}.tsx`

## Packages added
react-hook-form, @hookform/resolvers, zod, recharts, sonner, date-fns, cmdk, framer-motion
