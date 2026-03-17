# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # Type-check (tsc -b) then Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

There are no tests in this project.

## Architecture

This is a React 19 + TypeScript SPA — an e-commerce analytics dashboard (電商營運分析平台) built with Vite, Tailwind CSS v4, Recharts, and React Router v7. All data is currently hardcoded mock data (no API calls).

### Routing structure

`App.tsx` defines a single nested route tree under `<Layout />`. Five top-level sections, each with a `dashboard` index and several sub-pages:

| Path prefix | Section (Chinese) |
|---|---|
| `/overview` | 總表 — GMV, revenue, orders, conversion |
| `/members` | 會員 — member value, retention, segmentation |
| `/products` | 商品 — SKU revenue/margin, conversion, affinity |
| `/traffic` | 流量 — channel performance, ad funnel, acquisition |
| `/insights` | 洞察 — anomalies, growth opportunities, risky products |

### Key shared components

- **`Layout.tsx`** — `Sidebar` + `Header` + `<Outlet />` wrapper
- **`AnalyticsControlBar.tsx`** — date range picker, time granularity toggle, metric selector (flat or grouped), dimension filter (flat or two-level). All dropdowns are portaled to `document.body` with viewport collision detection.
- **`ColumnHeader.tsx`** — table `<th>` with inline sort + filter popup (portaled). Supports `string`, `numeric`, and `category` column types. Shift-click on column headers enables multi-column sort.
- **`FilterBadges.tsx`** — renders active filter chips, wired to `clearAllFilters` / `removeFilter` from `useBITable`
- **`SubpagePreviewCards.tsx`** — navigation cards shown at the bottom of dashboard pages linking to sub-pages
- **`MemberDrilldownDrawer.tsx`** — slide-out drawer for member detail drill-down
- **`TablePagination.tsx`** — page controls wired to `useBITable`

### `useBITable` hook (`src/hooks/useBITable.ts`)

The central hook for all data table pages. Accepts a typed data array and returns filter/sort/pagination state + handlers. Pages define column metadata (`ColDef[]`) and pass the hook's handlers to `ColumnHeader` and `TablePagination`.

Pipeline: **filter → sort → paginate**

- Filtering: numeric operators (`>`, `<`, `=`, `between`), string operators (`equals`, `contains`, `starts_with`), category operator (`in`)
- Sorting: multi-column, priority ordered (shift-click to add secondary sorts); first sort rule = primary
- `getNumericValue` / `getStringValue` / `getCategoryValue` can be overridden per page; defaults handle both flat keys and nested `item.metrics[key]` shapes

### Styling conventions

- Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- `clsx` + `tailwind-merge` for conditional class composition
- Color scheme: `slate-*` for neutrals, `indigo-600` as primary accent, `emerald` for positive deltas, `rose` for negative deltas
- All dropdown menus use `createPortal(…, document.body)` with `position: fixed` and manual viewport collision detection (see `updatePosition` pattern in `AnalyticsControlBar` and `ColumnHeader`)
