# Quality Gates

## Command

`pnpm run lint && pnpm run typecheck`

## Result

- pnpm run lint: FAIL
  - `app/(app)/workflows/created/page.tsx`: `_value` is defined but never used (`@typescript-eslint/no-unused-vars`)
- pnpm run typecheck: NOT RUN (lint failed first)

## Notes

- Lint failure appears unrelated to this change; resolve lint error and rerun.
