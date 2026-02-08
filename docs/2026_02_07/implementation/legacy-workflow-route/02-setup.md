# Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent |
|------|-------|-----------------|
| 1 | Create Legacy Route Directory and Page | page-route |
| 2 | Regenerate Type-Safe Route Definitions | orchestrator (Bash) |
| 3 | Replace Original Page with Blank-Slate | page-route |
| 4 | Simplify Route Type File | page-route |
| 5 | Add Legacy View Sidebar Nav Item | frontend-component |
| 6 | Create Legacy Workflows Index Redirect | page-route |
| 7 | Update Workflow Attention Notifier Regex | frontend-component |

## Dependencies
- Step 2 depends on Step 1 (new route must exist before regeneration)
- Step 3 and 4 can run together (both modify original route files)
- Step 5, 6, 7 are independent of each other
