## What changed
<!-- One-line summary -->

## Why
<!-- Business or technical reason -->

## Files changed
<!-- List every file touched and why -->

| File | Change |
|------|--------|
| | |

## Scope check
- [ ] No unrelated files changed
- [ ] No schema/migration changes (or documented below if yes)
- [ ] No env changes (or documented below if yes)
- [ ] No hardcoded venue-specific data added

## Validation
<!-- Paste dry-run output, query result, or test output that proves this works -->

```
# paste evidence here
```

## If this is an ops/data task
- Dry-run output: <!-- attached or pasted above -->
- Pre-import snapshot saved to: <!-- e.g. ~/Desktop/toast-pre-import-*.md -->
- Post-import validation queries passed: yes / no / n/a
- Approved data window enforced in script: yes / n/a

## Merge checklist
- [ ] Branch is up to date with `main`
- [ ] No `console.log` left in server code
- [ ] tRPC inputs validated with Zod
- [ ] `venueId` scoping present on any new DB queries
- [ ] Do not merge without owner review
