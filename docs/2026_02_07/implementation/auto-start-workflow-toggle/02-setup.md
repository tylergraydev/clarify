# Setup and Routing Table

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|-----------|-------|
| 1 | Add autoStart field to validation schema | tanstack-form | lib/validations/workflow.ts |
| 2 | Add auto-start toggle field to dialog form | frontend-component (batched 2-4) | components/workflows/create-workflow-dialog.tsx |
| 3 | Watch autoStart field value for dynamic submit button | frontend-component (batched 2-4) | components/workflows/create-workflow-dialog.tsx |
| 4 | Integrate auto-start with useCreateWorkflow hook | frontend-component (batched 2-4) | components/workflows/create-workflow-dialog.tsx |
| 5 | Modify onSuccess callback to receive workflow object | frontend-component (batched 5-6) | create-workflow-dialog.tsx, workflows-tab-content.tsx |
| 6 | Update copy workflow dialog instance | frontend-component (batched 5-6) | workflows-tab-content.tsx |

## Batching Strategy
- Steps 2-4 batched: all modify create-workflow-dialog.tsx with tightly coupled changes
- Steps 5-6 batched: both modify workflows-tab-content.tsx with related onSuccess logic
