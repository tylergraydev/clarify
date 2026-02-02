# Sandbox Configuration

Types for configuring sandbox behavior for command execution.

## `SandboxSettings`

Configuration for sandbox behavior. Use this to enable command sandboxing and configure network restrictions programmatically.

```typescript
type SandboxSettings = {
  enabled?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];
  allowUnsandboxedCommands?: boolean;
  network?: NetworkSandboxSettings;
  ignoreViolations?: SandboxIgnoreViolations;
  enableWeakerNestedSandbox?: boolean;
}
```

| Property | Type | Default | Description |
| :------- | :--- | :------ | :---------- |
| `enabled` | `boolean` | `false` | Enable sandbox mode for command execution |
| `autoAllowBashIfSandboxed` | `boolean` | `false` | Auto-approve bash commands when sandbox is enabled |
| `excludedCommands` | `string[]` | `[]` | Commands that always bypass sandbox restrictions (e.g., `['docker']`) |
| `allowUnsandboxedCommands` | `boolean` | `false` | Allow the model to request running commands outside the sandbox |
| `network` | `NetworkSandboxSettings` | `undefined` | Network-specific sandbox configuration |
| `ignoreViolations` | `SandboxIgnoreViolations` | `undefined` | Configure which sandbox violations to ignore |
| `enableWeakerNestedSandbox` | `boolean` | `false` | Enable a weaker nested sandbox for compatibility |

## `NetworkSandboxSettings`

Network-specific configuration for sandbox mode.

```typescript
type NetworkSandboxSettings = {
  allowLocalBinding?: boolean;
  allowUnixSockets?: string[];
  allowAllUnixSockets?: boolean;
  httpProxyPort?: number;
  socksProxyPort?: number;
}
```

| Property | Type | Default | Description |
| :------- | :--- | :------ | :---------- |
| `allowLocalBinding` | `boolean` | `false` | Allow processes to bind to local ports (e.g., for dev servers) |
| `allowUnixSockets` | `string[]` | `[]` | Unix socket paths that processes can access (e.g., Docker socket) |
| `allowAllUnixSockets` | `boolean` | `false` | Allow access to all Unix sockets |
| `httpProxyPort` | `number` | `undefined` | HTTP proxy port for network requests |
| `socksProxyPort` | `number` | `undefined` | SOCKS proxy port for network requests |

**Warning:** The `allowUnixSockets` option can grant access to powerful system services. For example, allowing `/var/run/docker.sock` effectively grants full host system access through the Docker API, bypassing sandbox isolation.

## `SandboxIgnoreViolations`

Configuration for ignoring specific sandbox violations.

```typescript
type SandboxIgnoreViolations = {
  file?: string[];
  network?: string[];
}
```

| Property | Type | Default | Description |
| :------- | :--- | :------ | :---------- |
| `file` | `string[]` | `[]` | File path patterns to ignore violations for |
| `network` | `string[]` | `[]` | Network patterns to ignore violations for |

## Usage Examples

### Basic Sandbox

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true
    }
  }
});
```

### With Network Configuration

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Start the dev server and run tests",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      network: {
        allowLocalBinding: true  // Allow dev server to bind to localhost
      }
    }
  }
});
```

### With Docker Access

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Build the Docker image",
  options: {
    sandbox: {
      enabled: true,
      excludedCommands: ['docker'],  // Docker always runs unsandboxed
      network: {
        allowUnixSockets: ['/var/run/docker.sock']
      }
    }
  }
});
```

### Unsandboxed Commands with Permission Callback

When `allowUnsandboxedCommands` is enabled, the model can request to run commands outside the sandbox by setting `dangerouslyDisableSandbox: true` in the tool input. These requests fall back to your `canUseTool` handler.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Deploy my application",
  options: {
    sandbox: {
      enabled: true,
      allowUnsandboxedCommands: true
    },
    permissionMode: "default",
    canUseTool: async (tool, input) => {
      if (tool === "Bash" && input.dangerouslyDisableSandbox) {
        console.log(`Unsandboxed command requested: ${input.command}`);
        // Implement your authorization logic here
        return isCommandAuthorized(input.command)
          ? { behavior: 'allow', updatedInput: input }
          : { behavior: 'deny', message: 'Command not authorized' };
      }
      return { behavior: 'allow', updatedInput: input };
    }
  }
});
```

**Warning:** If `permissionMode` is set to `bypassPermissions` and `allowUnsandboxedCommands` is enabled, the model can autonomously execute commands outside the sandbox without any approval prompts.

## Important Notes

- **Filesystem and network access restrictions** are NOT configured via sandbox settings. Instead, they are derived from permission rules:
  - Filesystem read restrictions: Read deny rules
  - Filesystem write restrictions: Edit allow/deny rules
  - Network restrictions: WebFetch allow/deny rules
- Use sandbox settings for command execution sandboxing, and permission rules for filesystem and network access control.
- `excludedCommands` vs `allowUnsandboxedCommands`:
  - `excludedCommands`: A static list of commands that always bypass the sandbox automatically
  - `allowUnsandboxedCommands`: Lets the model decide at runtime whether to request unsandboxed execution
