# Step 10: Create Discovery Streaming and Stale Indicator Components

**Status**: SUCCESS
**Specialist**: frontend-component
**Duration**: Completed

## Files Created

- `components/workflows/discovery-streaming.tsx` - Streaming output display with tool indicators, thinking blocks, and cancel functionality
- `components/workflows/stale-discovery-indicator.tsx` - Warning indicator for when refinement changes invalidate discovery

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Streaming component handles all message types
- [x] Stale indicator correctly detects timestamp differences
- [x] Cancel button properly aborts discovery
- [x] Components follow Base UI + CVA patterns

## Component Details

### DiscoveryStreaming

Features:
- Tool indicators showing active/complete tools
- Thinking block display with collapsible sections
- Streaming text output area
- Cancel button integration
- Phase-based UI states (idle, streaming, reviewing, complete, error)
- Collapsible tool history

Props:
- `activeTools`: Active tool list from store
- `phase`: Current discovery phase
- `streamingText`: Current streaming content
- `error`: Error message if any
- `onCancel`: Callback to cancel discovery

### StaleDiscoveryIndicator

Features:
- Compares `refinementUpdatedAt` with `discoveryCompletedAt`
- Warning banner with alert icon
- "Re-discover Files" action button
- Loading state during re-discovery

Props:
- `refinementUpdatedAt`: Timestamp of last refinement update
- `discoveryCompletedAt`: Timestamp of discovery completion
- `isRediscovering`: Loading state
- `onRediscover`: Callback to trigger re-discovery

## Conventions Applied

- CVA variants exported separately
- `is` prefix for booleans
- `handle` prefix for handlers
- Named exports only
