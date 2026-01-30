# Custom Agent Feature - Orchestration Index

**Generated**: 2026-01-29
**Feature**: Create new custom agent feature from the design document

## Workflow Overview

This orchestration implements the "Create New Custom Agent" feature for the Clarify application, allowing users to create brand new custom agents from scratch (not just customize existing built-in agents).

## Step Navigation

| Step | File                                                       | Status              | Duration |
| ---- | ---------------------------------------------------------- | ------------------- | -------- |
| 0a   | [Clarification](./00a-clarification.md)                    | Skipped (Score 4/5) | ~1s      |
| 1    | [Feature Refinement](./01-feature-refinement.md)           | Completed           | ~30s     |
| 2    | [File Discovery](./02-file-discovery.md)                   | Completed           | ~60s     |
| 3    | [Implementation Planning](./03-implementation-planning.md) | Completed           | ~90s     |

## Final Outputs

- **Implementation Plan**: [custom-agent-feature-implementation-plan.md](../plans/custom-agent-feature-implementation-plan.md)

## Summary

### Feature Request (Original)

"Create new custom agent feature from the design document needs to be implemented"

### Feature Request (Refined)

The Clarify application requires implementation of a complete "Create New Custom Agent" feature that enables users to define entirely new specialist agents from scratch, with a "Create Agent" button, comprehensive form following design specs, TanStack Form integration, Zod validation, duplicate/delete functionality, and visual distinction between custom and built-in agents.

### Key Metrics

| Metric             | Value       |
| ------------------ | ----------- |
| Total Steps        | 11          |
| Estimated Duration | 4-5 days    |
| Complexity         | Medium-High |
| Risk Level         | Medium      |
| Files to Modify    | 11          |
| Files to Create    | 1           |

### Files Summary

- **Critical**: 5 files (agents page, editor dialog, card, hooks, validations)
- **High Priority**: 6 files (IPC handlers, channels, preload, types, repository)
- **Reference**: 9 files (templates patterns, UI components)
- **Low Priority**: 6 files (related schemas and hooks)

## Execution Timeline

| Phase       | Steps | Focus                    |
| ----------- | ----- | ------------------------ |
| Backend     | 1-2   | Verify/add IPC handlers  |
| Data Layer  | 3-4   | Add hooks and validation |
| Core UI     | 5-7   | Dialog and confirmation  |
| Integration | 8-9   | Wire up card and page    |
| Polish      | 10-11 | Visual distinction, UX   |
