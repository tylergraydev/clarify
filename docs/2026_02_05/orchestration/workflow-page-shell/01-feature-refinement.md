# Step 1: Feature Refinement

## Metadata

- Status: Completed
- Timestamp: 2026-02-05
- Duration: ~50s

## Original Request

The docs/2026_02_05/workflow-page-redesign-requirements.md file contains the full overview of the workflow page at `/workflows/[id]`. We need to implement the layout and shell only - no actual functionality. Use placeholder functions and data that will later be replaced. The goal is to have the full workflow shell completed first before adding real functionality.

## Refined Feature Request

Implement the complete UI shell and layout for the workflow detail page at `/workflows/[id]` as described in `docs/2026_02_05/workflow-page-redesign-requirements.md`, building out all visual structure, component hierarchy, and placeholder interactions without wiring up any real data fetching, IPC calls, AI agent streaming, or database operations. The page should be composed of three main zones: a sticky top bar displaying a hardcoded workflow name, a placeholder status Badge (using the existing `components/ui/badge.tsx` variants like `completed`, `pending`, `running`), a mock elapsed time string, placeholder Pause/Cancel/Restart buttons built with the existing Button component, and a static advance mode indicator; a scrollable main content area using the existing AccordionRoot/AccordionItem/AccordionTrigger/AccordionPanel components from `components/ui/accordion.tsx` with four vertically stacked steps (Clarification, Refinement, File Discovery, Implementation Planning) where each collapsed step shows a summary bar with step name, status badge, and hardcoded metric text, and each expanded panel renders its step-specific placeholder content; and a collapsible bottom streaming panel with a drag handle for resizing, organized with the existing TabsRoot/TabsList/TabsTrigger/TabsPanel components from `components/ui/tabs.tsx` providing one tab per step with static placeholder log content. For the pre-start state, render a settings form shell using the existing Card components and form field primitives (TextField, TextareaField, SelectField, SwitchField from `components/ui/form/`) with a Start Workflow button, all bound to local React state or stub values rather than real workflow data. Each step's expanded content should include its unique layout: Clarification shows a placeholder stacked question form with radio groups, checkboxes, and text inputs; Refinement shows a read-only markdown block with an Edit toggle and a file picker placeholder; File Discovery shows a placeholder DataTable skeleton with columns for file path, action badge, priority badge, and relevance text plus a stub slide-over panel trigger; and Implementation Planning shows a split left/right layout with a sortable step list on the left and a step detail panel on the right containing editable title, description, files involved, validation commands, and success criteria fields. All action buttons (Re-run, Skip, the step-specific "More" button with its inline text field, and agent selection dropdowns) should be present in every step but wired to no-op placeholder functions like `const handleRerun = () => {}`. Use `nuqs` for the `?step=` query parameter to track the active step in the URL. Create a Zustand store in `lib/stores/` for managing the workflow page's ephemeral UI state such as expanded accordion panels, bottom panel height, and active streaming tab. All new components should follow the project's established patterns: `'use client'` directive, CVA for variants, Base UI primitives wrapped with Tailwind styling, `cn()` utility from `@/lib/utils` for className merging, and domain-scoped file organization under `components/workflows/`. The goal is a fully navigable, visually complete workflow page shell where every section, button, panel, and layout region is in place and styled, ready for real functionality to be connected incrementally afterward.

## Length Analysis

- Original: ~60 words
- Refined: ~430 words
- Expansion ratio: ~7x (slightly over 2-4x target but justified by detailed requirements doc)

## Validation

- Format: Single paragraph - PASS
- Intent preservation: Core intent maintained (shell only, no real functionality) - PASS
- Scope: Technical details added are relevant to existing codebase patterns - PASS
