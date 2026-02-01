# Installation & Setup - Claude Agent SDK

## Overview

The Claude Agent SDK requires Claude Code CLI as its runtime environment. This guide covers complete installation and configuration for both the CLI and SDK.

## Prerequisites

- **Python**: Version 3.10 or higher (for Python SDK)
- **Node.js**: Version 18 or higher (for TypeScript SDK or CLI installation via npm)
- **npm**: Package manager (bundled with Node.js)
- **Operating System**: Windows, macOS, or Linux

## Step 1: Install Claude Code CLI

The Claude Code CLI is the runtime environment that the SDK uses to execute tools and manage agent sessions.

### Windows Installation

Open PowerShell and run:

```powershell
irm https://claude.ai/install.ps1 | iex
```

After installation, add `C:\Users\<user>\.local\bin` to your system PATH and restart PowerShell.

### macOS/Linux Installation via npm

```bash
npm install -g @anthropic-ai/claude-code
```

### Alternative: Direct Installation

Visit [claude.ai/download](https://claude.ai/download) for platform-specific installers.

### Verify Installation

After installing, verify Claude Code is accessible:

```bash
claude --version
```

You should see the Claude Code version number.

## Step 2: Authenticate Claude Code

Run Claude Code once to complete authentication:

```bash
claude
```

Follow the prompts to:
1. Choose authentication method (subscription account or API key)
2. Sign in with your Claude account
3. Set preferences (theme, interface options)

The SDK will use this authentication automatically.

## Step 3: Install the SDK

### Python SDK

```bash
pip install claude-agent-sdk
```

For a specific version:

```bash
pip install claude-agent-sdk==1.0.0
```

### TypeScript SDK

```bash
npm install @anthropic-ai/claude-agent-sdk
```

For development dependencies:

```bash
npm install --save-dev typescript @types/node tsx
```

## Step 4: Configure API Authentication

### Option 1: Use Claude Code Authentication (Recommended)

If you've authenticated Claude Code (Step 2), the SDK uses that authentication automatically. No additional configuration needed.

### Option 2: Set API Key Directly

Get your API key from the [Anthropic Console](https://console.anthropic.com/).

#### Environment Variable

Create a `.env` file in your project:

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

Or export directly:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

#### In Code (Python)

```python
from claude_agent_sdk import query, ClaudeAgentOptions
import os

os.environ['ANTHROPIC_API_KEY'] = 'your-api-key'
```

#### In Code (TypeScript)

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

process.env.ANTHROPIC_API_KEY = 'your-api-key';
```

### Option 3: Third-Party API Providers

#### AWS Bedrock

```bash
export CLAUDE_CODE_USE_BEDROCK=1
# Configure AWS credentials via AWS CLI or environment variables
```

#### Google Cloud Vertex AI

```bash
export CLAUDE_CODE_USE_VERTEX=1
# Configure Google Cloud credentials
```

#### Azure Foundry

```bash
export CLAUDE_CODE_USE_FOUNDRY=1
# Configure Azure credentials
```

## Step 5: Verify SDK Installation

### Python Test

Create `test_sdk.py`:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="What is 2+2?",
        options=ClaudeAgentOptions(max_turns=1)
    ):
        if message.type == "result" and message.subtype == "success":
            print(f"✓ SDK working! Result: {message.result}")

asyncio.run(main())
```

Run:

```bash
python test_sdk.py
```

### TypeScript Test

Create `test_sdk.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  for await (const message of query({
    prompt: "What is 2+2?",
    options: { maxTurns: 1 }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log(`✓ SDK working! Result: ${message.result}`);
    }
  }
}

main();
```

Run:

```bash
npx tsx test_sdk.ts
```

## Common Installation Issues

### CLINotFoundError

**Problem**: SDK can't find Claude Code CLI

**Solution**:
1. Verify Claude Code is installed: `claude --version`
2. Ensure Claude Code is in your PATH
3. Restart terminal after installation
4. On Windows, verify `C:\Users\<user>\.local\bin` is in PATH

### API Key Not Found

**Problem**: SDK reports missing API key

**Solution**:
1. Run `claude` to authenticate Claude Code
2. Or set `ANTHROPIC_API_KEY` environment variable
3. Verify key from [Anthropic Console](https://console.anthropic.com/)

### Permission Denied (macOS/Linux)

**Problem**: Installation fails with permission errors

**Solution**:
```bash
sudo npm install -g @anthropic-ai/claude-code
```

Or use a version manager like `nvm` to avoid sudo.

### Python Version Mismatch

**Problem**: SDK requires Python 3.10+

**Solution**:
```bash
python --version  # Check current version
# Install Python 3.10+ from python.org
# Or use pyenv to manage versions
```

## Project Setup Best Practices

### Create Project Directory

```bash
mkdir my-agent-project
cd my-agent-project
```

### Initialize Python Project

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install claude-agent-sdk
```

Create `requirements.txt`:

```
claude-agent-sdk==1.0.0
python-dotenv==1.0.0
```

### Initialize TypeScript Project

```bash
npm init -y
npm install @anthropic-ai/claude-agent-sdk
npm install --save-dev typescript @types/node tsx
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Environment Configuration

Create `.env`:

```bash
ANTHROPIC_API_KEY=your-api-key
CLAUDE_AGENT_MODEL=sonnet  # Options: sonnet, opus, haiku
CLAUDE_AGENT_CWD=/path/to/project
CLAUDE_AGENT_PERMISSION_MODE=default
CLAUDE_AGENT_MAX_TURNS=50
CLAUDE_AGENT_MAX_BUDGET_USD=10
```

Create `.gitignore`:

```
.env
.env.local
venv/
node_modules/
dist/
*.pyc
__pycache__/
.DS_Store
```

## Configuration Options via Environment

These environment variables control SDK behavior:

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `CLAUDE_AGENT_CLI_PATH` | Path to Claude CLI executable | Auto-detected |
| `CLAUDE_AGENT_MODEL` | Model to use (sonnet/opus/haiku) | sonnet |
| `CLAUDE_AGENT_CWD` | Working directory for CLI | Current directory |
| `CLAUDE_AGENT_PERMISSION_MODE` | Permission mode | default |
| `CLAUDE_AGENT_MAX_TURNS` | Maximum conversation turns | 50 |
| `CLAUDE_AGENT_MAX_BUDGET_USD` | Budget limit in USD | No limit |

## Next Steps

After installation:

1. **Review [Agents](./agents.md)** - Learn to create and configure agents
2. **Explore [Tools](./tools.md)** - Understand built-in and custom tools
3. **Try [Streaming Output](./streaming-output.md)** - Implement real-time interactions
4. **Study [Examples](https://github.com/anthropics/claude-agent-sdk-python/tree/main/examples)** - See working code

## Additional Resources

- [Claude Code Setup Guide](https://code.claude.com/docs/setup)
- [Troubleshooting Guide](https://platform.claude.com/docs/en/agent-sdk/troubleshooting)
- [API Console](https://console.anthropic.com/) - Manage API keys
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-python) - Python SDK source