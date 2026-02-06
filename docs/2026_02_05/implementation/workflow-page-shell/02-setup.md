# Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent |
|------|-------|-----------------|
| 1 | Add Layout Constants | general-purpose |
| 2 | Create Zustand Store | zustand-store |
| 3 | Update Route Type with Search Params | page-route |
| 4 | Create Workflow Top Bar | frontend-component |
| 5 | Create Pre-Start Settings Form | tanstack-form |
| 6 | Clarification Step Content | frontend-component |
| 7 | Refinement Step Content | frontend-component |
| 8 | File Discovery Step Content | frontend-component |
| 9 | Implementation Planning Step Content | frontend-component |
| 10 | Create Workflow Step Accordion | frontend-component |
| 11 | Create Workflow Streaming Panel | frontend-component |
| 12 | Create Barrel Export (detail) | general-purpose |
| 13 | Update Workflows Barrel Export | general-purpose |
| 14 | Compose Workflow Detail Page | page-route |
| 15 | Add CSS Custom Properties | general-purpose |

## Dependency Graph

- Step 2 depends on Step 1 (constants)
- Steps 4-11 are independent of each other
- Step 10 depends on Steps 6-9 (imports step content components)
- Step 12 depends on Steps 4-11 (barrel exports all detail components)
- Step 13 depends on Step 12
- Step 14 depends on Steps 3, 10, 11, 12
- Step 15 is independent
