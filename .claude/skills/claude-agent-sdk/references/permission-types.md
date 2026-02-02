# Permission Types

Types related to permission control and management.

## `PermissionMode`

Available permission modes for controlling tool execution.

```typescript
type PermissionMode =
  | 'default'           // Standard permission behavior
  | 'acceptEdits'       // Auto-accept file edits
  | 'bypassPermissions' // Bypass all permission checks
  | 'plan'              // Planning mode - no execution
```

| Mode | Description |
|:-----|:------------|
| `default` | Standard permission behavior - unmatched tools trigger `canUseTool` callback |
| `acceptEdits` | Auto-accept file edits and filesystem operations |
| `bypassPermissions` | Bypass all permission checks (use with caution) |
| `plan` | Planning mode - Claude plans without making changes |

## `CanUseTool`

Custom permission function type for controlling tool usage.

```typescript
type CanUseTool = (
  toolName: string,
  input: ToolInput,
  options: {
    signal: AbortSignal;
    suggestions?: PermissionUpdate[];
  }
) => Promise<PermissionResult>;
```

### Example

```typescript
const canUseTool: CanUseTool = async (toolName, input, { signal }) => {
  if (toolName === "Bash" && input.command.includes("rm -rf")) {
    return {
      behavior: 'deny',
      message: 'Dangerous command blocked'
    };
  }
  return {
    behavior: 'allow',
    updatedInput: input
  };
};
```

## `PermissionResult`

Result of a permission check.

```typescript
type PermissionResult =
  | {
      behavior: 'allow';
      updatedInput: ToolInput;
      updatedPermissions?: PermissionUpdate[];
    }
  | {
      behavior: 'deny';
      message: string;
      interrupt?: boolean;
    }
```

### Allow Result

| Field | Type | Description |
|:------|:-----|:------------|
| `behavior` | `'allow'` | Indicates the tool is allowed |
| `updatedInput` | `ToolInput` | Potentially modified tool input |
| `updatedPermissions` | `PermissionUpdate[]` | Optional permission updates |

### Deny Result

| Field | Type | Description |
|:------|:-----|:------------|
| `behavior` | `'deny'` | Indicates the tool is denied |
| `message` | `string` | Reason for denial |
| `interrupt` | `boolean` | Whether to interrupt the session |

## `PermissionUpdate`

Operations for updating permissions.

```typescript
type PermissionUpdate =
  | {
      type: 'addRules';
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: 'replaceRules';
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: 'removeRules';
      rules: PermissionRuleValue[];
      behavior: PermissionBehavior;
      destination: PermissionUpdateDestination;
    }
  | {
      type: 'setMode';
      mode: PermissionMode;
      destination: PermissionUpdateDestination;
    }
  | {
      type: 'addDirectories';
      directories: string[];
      destination: PermissionUpdateDestination;
    }
  | {
      type: 'removeDirectories';
      directories: string[];
      destination: PermissionUpdateDestination;
    }
```

## `PermissionBehavior`

```typescript
type PermissionBehavior = 'allow' | 'deny' | 'ask';
```

| Value | Description |
|:------|:------------|
| `allow` | Automatically allow the tool |
| `deny` | Automatically deny the tool |
| `ask` | Prompt for approval |

## `PermissionUpdateDestination`

Where to persist permission updates.

```typescript
type PermissionUpdateDestination =
  | 'userSettings'     // Global user settings
  | 'projectSettings'  // Per-directory project settings
  | 'localSettings'    // Gitignored local settings
  | 'session'          // Current session only
```

| Value | Description | Persistence |
|:------|:------------|:------------|
| `userSettings` | Global user settings | `~/.claude/settings.json` |
| `projectSettings` | Per-directory project settings | `.claude/settings.json` |
| `localSettings` | Gitignored local settings | `.claude/settings.local.json` |
| `session` | Current session only | Not persisted |

## `PermissionRuleValue`

A single permission rule.

```typescript
type PermissionRuleValue = {
  toolName: string;
  ruleContent?: string;
}
```

| Field | Type | Description |
|:------|:-----|:------------|
| `toolName` | `string` | Name of the tool this rule applies to |
| `ruleContent` | `string` | Optional content/pattern for the rule |
