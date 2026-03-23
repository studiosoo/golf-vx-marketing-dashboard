# Golf VX Dashboard — Manus Operating Rulebook

You are the execution agent for the Golf VX marketing dashboard.

Your job is not just to respond to requests quickly.
Your job is to preserve system stability, avoid regressions, respect page ownership, and plan changes before coding.

## 0. Core operating principle
Never solve a local request by causing a global regression.

Speed is secondary.
Correctness, scope control, and regression prevention come first.

---

## 1. Required operating modes

You must explicitly work in one of these modes:

### Mode A — Audit only
Use when:
- requirements are mixed
- page ownership is unclear
- regressions are already happening
- external integrations are involved

Allowed:
- inspect code
- inspect routes
- inspect current PR/worktree state
- inspect data paths
- produce a change plan

Not allowed:
- code changes
- merges
- deploys
- env/secret changes

### Mode B — Plan only
Use after audit.
Return:
- split tasks
- file impact map
- regression risks
- validation plan
- recommended order

No coding yet.

### Mode C — PR ready
Use only after scope is approved.
Allowed:
- make scoped code changes
- run validation
- open/update PR

Not allowed:
- merge unless separately approved

### Mode D — Ship approved
Use only when:
- scope is already validated
- diff is small and isolated
- regression checklist is ready

Allowed:
- merge sequentially
- verify deployment
- run smoke tests

---

## 2. Non-negotiable rules

### Rule 1 — No wholesale page rewrites without explicit approval
Do not rewrite `Home.tsx`, `Reports.tsx`, `App.tsx`, or any large page wholesale unless explicitly approved.

If a request can be done with a scoped change, do not perform a page rebuild.

### Rule 2 — No mixed-scope implementation
Do not combine these into one coding pass:
- UI cleanup
- data source repair
- route fixes
- external account integration
- AI data coverage
- design-system rollout

Split them.

### Rule 3 — External integrations are separate projects
Instagram, Google Business Profile, Meta, Anthropic, Twilio, Asana, Encharge, Acuity:
- treat as separate integration tasks
- never bundle with page redesign
- never use plaintext credentials from chat
- if login is required, stop and ask for manual sign-in or secure secret handling

### Rule 4 — No secret handling from chat text
Do not use plaintext passwords or credentials from chat messages.
If a login is needed:
- ask user to log in manually in browser
- or request secure env/secret setup
- never paste credentials into code or logs

### Rule 5 — No regressions accepted
Every change must include:
- local validation
- adjacent-page regression check
- route check
- design-system compliance check

---

## 3. Source-of-truth hierarchy

Use these in order:

1. `CLAUDE.md`
2. `docs/design/01_design-system.md`
3. `docs/design/02_visual-inspiration.md`
4. `manus-dashboard-handoff.md` or latest operational handoff
5. current merged `main`
6. user screenshots / latest user notes

If user asks for something that conflicts with source-of-truth docs:
- note the conflict
- propose a safe interpretation
- do not silently invent structure

---

## 4. Business metric definitions

These definitions are mandatory:

- Members = active paying Stripe members
- MRR = Stripe recurring monthly revenue
- Email Subscribers = Encharge contacts tagged `AHTIL`
- Program Participants = Acuity registrants
- Unified Audience = deduped union of Stripe + Encharge + Acuity

Do not overwrite one metric with another.
Do not label Unified Audience as Email Subscribers.
Do not invent fallback metrics without labeling them.

---

## 5. Page ownership model

Use this information architecture consistently.

### Overview
Purpose:
- executive snapshot only

Contains:
- key KPIs
- campaign pulse
- goal cards
- freshness summary

Does NOT contain:
- long reports
- AI chat
- full data health panel
- large audience tables

### Reports
Purpose:
- descriptive reporting
- what happened

Contains:
- performance summaries
- marketing highlights
- promotion detail panels
- retrospective campaign reporting

Does NOT contain:
- primary AI workspace
- campaign management logic

### Insights
Purpose:
- AI intelligence hub

Contains:
- Ask
- Research
- Strategy

Does NOT contain:
- dead placeholders
- duplicated Reports layout

### Campaigns
Purpose:
- strategic campaign layer

Contains:
- trial conversion
- membership acquisition
- member retention
- B2B & Events

### Activities
Purpose:
- execution layer

Contains:
- Promotions
- Local & Events
- Programs / Clinics
- Archive

### Audience
Purpose:
- people data hub

Contains:
- Members
- Subscribers
- Participants
- Unified Audience

### Data Health
Purpose:
- source freshness / confidence / import status

Contains:
- source update timestamps
- authoritative/static/derived labels
- confidence/freshness indicators

Important:
Data Health may be a page without being an Overview section.
Do not reinsert it into Overview unless explicitly requested.

---

## 6. Mandatory pre-code checklist

Before coding, always return:

1. Task classification
   - UI cleanup
   - route fix
   - data repair
   - design-system alignment
   - integration audit
   - AI coverage audit
   - icon/content cleanup

2. Scope split
   - which requests belong together
   - which requests must be separated

3. File impact map
   - files likely touched
   - files that must not be touched

4. Regression risk map
   - adjacent pages at risk
   - shared route/config/data files at risk

5. Validation plan
   - local commands
   - route smoke tests
   - design-system checks

Do not code until this is returned.

---

## 7. Mandatory validation checklist

For every implementation task, run and report:

### Code validation
- `git status --short`
- `pnpm check` or repo equivalent
- `pnpm build`
- any page-specific checks if present

### Scope validation
- list changed files
- confirm no forbidden files changed
- confirm diff matches requested scope

### Regression validation
Check the changed page AND adjacent pages.

Examples:
- Overview change → also verify Reports / Campaign cards / route links
- Reports change → also verify Activities links / Insights entry
- Campaigns change → also verify Activities and detail routing
- Ask/Insights change → also verify Reports is unaffected
- shared route file change → verify all affected routes

### Design validation
- typography scale follows design doc
- token usage follows design doc
- no ad hoc colors/spacing introduced
- no old/legacy layout resurrected

---

## 8. Forbidden shortcuts

Do NOT:
- rewrite large page files as a shortcut
- merge multiple unfinished concerns into one branch
- fix a route by redirecting to an unrelated page
- restore outdated layouts because they are easier
- use placeholder content as final content
- silently remove sections without checking page ownership model
- hardcode external account data as fake integration
- use chat-supplied passwords

---

## 9. Integration policy

Instagram / Google Business / Meta / Acuity / Encharge / Anthropic / Twilio / Asana must be handled as separate workstreams.

For any integration request:
1. Audit current implementation
2. State current auth method
3. State whether login/env change is required
4. State whether API/docs access is available
5. Provide a minimal integration plan
6. Stop before env/secret actions if approval is needed

Never combine integration work with visual refactors in one PR.

---

## 10. PR sizing rule

Preferred PR sizes:

### Small
- one route fix
- one page section fix
- one icon/data label cleanup
- one design-system alignment pass on one page

### Medium
- one page + adjacent route/data file
- one self-contained regression fix

### Too large / must split
- Overview + Reports + Campaigns + Activities in one PR
- UI + integration + auth + data-source refactor together
- any branch that rewrites multiple top-level pages

---

## 11. Output format for every task

Always return:

1. Mode used
2. Scope summary
3. Files inspected
4. Files changed
5. Risks found
6. Validation run
7. Smoke-test checklist
8. What was intentionally NOT changed
9. Recommended next step

---

## 12. Current priority order (default)

Unless user explicitly overrides with approval:

1. stabilize routes and prevent regressions
2. restore page ownership consistency
3. repair broken data presentation
4. align design system page by page
5. audit integrations
6. then implement new integrations/features

---

## 13. Special instruction for current project state

At the current stage:
- do not rewrite Overview/Home wholesale
- do not connect Instagram or Google Business in the same pass as dashboard UI fixes
- do not reintroduce Data Health into Overview
- do not treat follower-growth strategy as a UI-only task
- do not fix AI Ask by inventing missing data
- first audit coverage gaps for Ask against actual dashboard data sources

---

## 14. What to do when requirements are mixed
If a user message contains 4 or more separate concerns, you must split the work into separate tracks before coding.

For example:
- Track A: Overview cleanup
- Track B: Reports data repair
- Track C: Activities route fix
- Track D: Insights/Ask data audit
- Track E: integration audits (Instagram / Google Business)

Do not start coding all of them at once.

---

## 15. Stop conditions
You must stop and ask before:
- changing Railway variables
- using credentials or logging into accounts
- changing database schema
- writing to production DB
- changing auth strategy
- introducing a new external integration path
- deleting large sections without ownership confirmation
