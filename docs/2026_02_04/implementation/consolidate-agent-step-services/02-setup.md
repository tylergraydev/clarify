# Setup and Routing Table

**Phase Started**: 2026-02-04T00:00:00Z

## Branch Strategy

✅ Created feature branch: `feat/consolidate-agent-step-services`

## Routing Table

All 10 steps will use the **general-purpose** subagent since this refactoring involves creating new utility classes and refactoring existing services that don't fit into specialist categories.

| Step | Title | Specialist Agent | Primary Files |
|------|-------|-----------------|---------------|
| 1 | Create AgentSdkExecutor class | general-purpose | electron/services/agent-step/agent-sdk-executor.ts |
| 2 | Create BaseAgentStepService abstract class | general-purpose | electron/services/agent-step/base-agent-step-service.ts |
| 3 | Create StepAuditLogger utility class | general-purpose | electron/services/agent-step/step-audit-logger.ts |
| 4 | Create StructuredOutputValidator utility class | general-purpose | electron/services/agent-step/structured-output-validator.ts |
| 5 | Create AgentTimeoutManager utility | general-purpose | electron/services/agent-step/agent-timeout-manager.ts |
| 6 | Create OutcomeBuilder factory utility | general-purpose | electron/services/agent-step/outcome-builder.ts |
| 7 | Refactor Clarification Service | general-purpose | electron/services/clarification-step.service.ts |
| 8 | Refactor Refinement Service | general-purpose | electron/services/refinement-step.service.ts |
| 9 | Refactor File Discovery Service | general-purpose | electron/services/file-discovery.service.ts |
| 10 | Update type exports and documentation | general-purpose | electron/services/agent-step/index.ts, README.md |

## Implementation Strategy

**Phase 1: Foundation (Steps 1-6)**
- Build shared abstractions from the ground up
- Each utility is independent and can be validated in isolation
- Priority order follows dependency graph (AgentSdkExecutor first as it's used by BaseAgentStepService)

**Phase 2: Integration (Steps 7-9)**
- Refactor existing services one at a time
- Clarification → Refinement → File Discovery (increasing complexity)
- Validate at each stage that the abstractions work correctly

**Phase 3: Documentation (Step 10)**
- Update exports for discoverability
- Create comprehensive documentation for future developers

## Success Metrics

**Target Line Reduction**: 1,800-2,000 lines across three services
- Clarification Service: ~400-500 lines saved
- Refinement Service: ~400-500 lines saved
- File Discovery Service: ~400-500 lines saved
- Shared modules: ~400-600 lines of new infrastructure

**Net Savings**: ~1,200-1,400 lines (after accounting for new shared code)

## Next Steps

Proceed to Step 1: Create AgentSdkExecutor class
