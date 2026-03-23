# Golf VX Dashboard — IA Redefinition Audit Report

This report evaluates the current state of the Golf VX Marketing Dashboard against the target Information Architecture (IA) defined in the "IA Redefinition Directive".

## 1. Page Inventory

| Current Route/Page | Component/Wrapper | Current Owner/Purpose | Target IA Alignment |
|-------------------|-------------------|-----------------------|---------------------|
| `/app/:venue/dashboard` | `Home.tsx` / `DashboardPageWrapper` | Executive snapshot | ✅ Overview |
| `/app/:venue/reports` | `Reports.tsx` / `ReportsPageWrapper` | Descriptive analytics | ✅ Reports |
| `/app/:venue/studio-soo/autopilot` | `InsightsRecommendationsWrapper` | Mixed (AI + Studio Soo) | ❌ Should move to Insights |
| `/app/:venue/studio-soo/campaigns` | `OperationsCampaignsWrapper` | Strategic campaigns | ❌ Should move to Campaigns |
| `/app/:venue/studio-soo/activities/*` | `Activities.tsx` / `StudioSooActivitiesWrapper` | Execution layer | ❌ Should move to Activities |
| `/app/:venue/audience/people` | `AudiencePeopleWrapper` | People data | ✅ Audience |
| `/app/:venue/insights/ask` | `InsightsAskWrapper` | AI interpretation | ✅ Insights |
| `/app/:venue/operations/*` | Various Wrappers | Legacy operations | ❌ Deprecate / Redirect |
| *(Missing)* | None | Data Health | ❌ Missing |

## 2. Mismatch Table

| Page / Route | Current Role | Target Role | Problem | Recommended Action |
|-------------|--------------|-------------|---------|--------------------|
| `/app/:venue/studio-soo/campaigns` | Studio Soo sub-page | Top-level Campaigns | Campaigns are buried under Studio Soo | **Rename/Move** to `/app/:venue/campaigns` |
| `/app/:venue/studio-soo/activities` | Studio Soo sub-page | Top-level Activities | Activities are buried under Studio Soo | **Rename/Move** to `/app/:venue/activities` |
| `/app/:venue/studio-soo/autopilot` | Studio Soo sub-page | Insights / Strategy | Redundant with Insights | **Merge/Redirect** to `/app/:venue/insights/strategy` |
| `/app/:venue/operations/*` | Main navigation legacy | Deprecated | Bloats routing, overlaps with Studio Soo / Activities | **Redirect** to canonical Activities/Campaigns |
| `PerformancePageWrapper` | Standalone page | Reports | Overlaps with Reports | **Merge** into Reports |
| *(Missing Data Health)* | N/A | Top-level Data Health | No dedicated source-of-truth page | **Create** new Data Health page |

## 3. Route-Correction Table

| Current Route | Problem | Canonical Replacement | Action |
|---------------|---------|-----------------------|--------|
| `/app/:venue/studio-soo/campaigns` | Buried under Studio Soo | `/app/:venue/campaigns` | Update `navConfig.ts` & `routes.ts` |
| `/app/:venue/studio-soo/activities` | Buried under Studio Soo | `/app/:venue/activities` | Update `navConfig.ts` & `routes.ts` |
| `/app/:venue/operations/paid-media` | Legacy route | `/app/:venue/activities/promotions` | Redirect |
| `/app/:venue/operations/programs` | Legacy route | `/app/:venue/activities/programs` | Redirect |
| `/app/:venue/performance` | Redundant standalone | `/app/:venue/reports` | Redirect |
| `/intelligence/*` | Legacy alias | `/app/:venue/insights/*` | Keep redirects |
| `/campaigns/*` | Legacy alias | `/app/:venue/campaigns/*` | Update redirect target |

## 4. Data-Ownership Table

| Metric | Source of Truth | Where it should live | Where it should NOT live |
|--------|-----------------|----------------------|--------------------------|
| Members | Stripe Snapshot | Audience (Members), Overview | Activities, Campaigns |
| Subscribers | Encharge (AHTIL) | Audience (Subscribers), Overview | Reports |
| Participants | Acuity Scheduler | Audience (Participants), Activities | Insights |
| Revenue | Stripe / Acuity / Toast | Reports, Overview | Insights |
| Freshness | System timestamps | Data Health | Scattered across all pages |

## 5. Phased Implementation Recommendation

### Phase 1: Critical Stability Fixes (Immediate)
- Update `navConfig.ts` to reflect the 7 canonical top-level items: Overview, Reports, Insights, Campaigns, Activities, Audience, Data Health.
- Update `routes.ts` to expose `/app/:venue/campaigns` and `/app/:venue/activities` directly instead of under `studio-soo`.
- Add a placeholder for Data Health.
- Ensure all legacy `/operations/*` routes redirect cleanly to the new canonical routes.

### Phase 2: IA Cleanup (Next)
- Move Campaign and Activity detail pages to their canonical URLs.
- Remove redundant "Performance" and "Autopilot" pages if they overlap with Reports and Insights.

### Phase 3: New Pages
- Fully build out the **Data Health** page showing Stripe, Encharge, and Acuity sync timestamps.
- Fully implement the **Audience** hub with Unified Audience logic.

### Phase 4: AI Workflow Expansion
- Enhance the Insights hub (Ask, Research, Strategy) with deeper context from the unified data layer.

## 6. Final Recommendation

1. **Move** Campaigns and Activities out of the `Studio Soo` namespace and elevate them to top-level navigation items. The `Studio Soo` label should be deprecated as a navigation group, as the dashboard itself is the tool.
2. **Merge** `Performance` into `Reports` to avoid descriptive analytics fragmentation.
3. **Archive** legacy `operations` views that are now covered by `Activities`.
4. **Create** `Data Health` as a new top-level page.
