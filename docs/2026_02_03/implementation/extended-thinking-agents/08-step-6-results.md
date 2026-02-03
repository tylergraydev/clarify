# Step 6: Add Extended Thinking UI Fields to Agent Editor Dialog

**Step**: 6/9
**Specialist**: frontend-component
**Status**: ✅ Success

## Changes Made

**Files Modified**:
- `components/agents/agent-editor-dialog.tsx` - Added extended thinking UI fields with conditional rendering and updated form submission handlers

## Implementation Details

### 1. Extended Thinking Toggle Field
Added `SwitchField` for `extendedThinkingEnabled` after Permission Mode field:
- **Label**: "Extended Thinking"
- **Description**: Clearly warns users that "Real-time text streaming is disabled when extended thinking is active - responses will appear after thinking completes"
- **Default**: false

### 2. Conditional Token Budget Field
Added conditional `NumberField` for `maxThinkingTokens` using `form.Subscribe`:
- **Visibility**: Only appears when toggle is enabled
- **Range**: 1,000 - 128,000 tokens
- **Step**: 1,000
- **Label**: "Thinking Token Budget"
- **Description**: "1,000 - 128,000 tokens. Recommended: 10,000 for most tasks."

### 3. Form Default Values
Updated default values for all modes:
- Create mode: `extendedThinkingEnabled: false`, `maxThinkingTokens: undefined`
- Edit mode: Loads from existing agent
- Defaults properly initialized

### 4. Form Submission Handlers
Updated both create and update mutation handlers:
- Added `extendedThinkingEnabled` to submission data
- Added `maxThinkingTokens` to submission data
- No manual type conversions needed (Drizzle handles boolean mode)

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [✓] Component compiles without TypeScript errors
- [✓] Switch toggle renders and functions correctly
- [✓] Number field only appears when toggle is enabled
- [✓] Number field respects min/max constraints
- [✓] Form submission includes new field values
- [✓] Description clearly communicates streaming behavior change
- [✓] All validation commands pass

## Impact

Users can now:
- Enable/disable extended thinking per agent
- Configure thinking token budget when enabled
- Understand the trade-off between extended thinking and real-time streaming
- See clear validation feedback for out-of-range values

**Agent ID**: a2827a0 (for resuming if needed)
