# Skills - Claude Agent SDK

## Overview

Skills extend Claude agents with specialized capabilities that are autonomously invoked when relevant. Skills are packaged as `SKILL.md` files containing instructions, descriptions, and optional supporting resources. They enable you to transform general-purpose agents into specialized experts.

## What Are Skills?

**Skills = Prompt Template + Conversation Context Injection + Execution Context Modification + Optional Data Files**

A Skill is essentially:
- Markdown file (`SKILL.md`) with instructions
- Optional supporting files (Python scripts, data files, etc.)
- Automatically discovered and invoked by Claude when relevant
- Isolated execution context with configurable permissions

## Skill Architecture

### Directory Structure

Skills must be located in specific directories:

**User-level Skills (global):**
```
~/.claude/skills/
  ├── skill-name/
  │   ├── SKILL.md
  │   ├── data.json (optional)
  │   └── helper.py (optional)
  └── another-skill/
      └── SKILL.md
```

**Project-level Skills (project-specific):**
```
project-root/
  └── .claude/
      └── skills/
          ├── project-skill/
          │   ├── SKILL.md
          │   └── resources/
          └── another-skill/
              └── SKILL.md
```

### SKILL.md Format

```markdown
---
name: "Skill Name"
description: "Brief description of what this skill does (shown to Claude)"
version: "1.0.0"
author: "Your Name"
tags: ["category", "keywords"]
---

# Skill Name

## Purpose
Detailed description of what this skill does and when to use it.

## Instructions
Step-by-step instructions for Claude to follow when this skill is invoked.

## Tools Required
- Read
- Write
- Bash

## Examples
### Example 1
Input: ...
Expected behavior: ...

## Notes
Additional context, limitations, or considerations.
```

## Enabling Skills in SDK

### Step 1: Configure Setting Sources

Skills require filesystem-based configuration:

**Python:**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    cwd="/path/to/project",  # Project with .claude/skills/
    setting_sources=["user", "project"],  # Load from both locations
    allowed_tools=["Skill", "Read", "Write", "Bash"]  # Enable Skill tool
)
```

**TypeScript:**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const options = {
  cwd: "/path/to/project",
  settingSources: ['user', 'project'],
  allowedTools: ['Skill', 'Read', 'Write', 'Bash']
};
```

### Step 2: Add "Skill" to Allowed Tools

The `Skill` tool must be explicitly enabled:

```python
options = ClaudeAgentOptions(
    allowed_tools=[
        "Skill",    # Enable Skills
        "Read",     # Skills may need these tools
        "Write",
        "Bash"
    ]
)
```

### Step 3: Query with Skills Enabled

```python
async for message in query(
    prompt="Help me process this PDF document",
    options=options
):
    print(message)
```

Claude automatically discovers available Skills and invokes them when relevant.

## Skill Discovery

### Listing Available Skills

Ask Claude directly:

```python
options = ClaudeAgentOptions(
    setting_sources=["user", "project"],
    allowed_tools=["Skill"]
)

async for message in query(
    prompt="What Skills are available?",
    options=options
):
    print(message)
```

Claude lists Skills based on your configuration.

### How Skills Are Discovered

1. SDK scans `~/.claude/skills/` (if "user" in `setting_sources`)
2. SDK scans `.claude/skills/` (if "project" in `setting_sources`)
3. Skills are bundled into the `Skill` tool description
4. Claude reads Skill descriptions and matches against user requests

## Creating Custom Skills

### Example: PDF Processing Skill

**Directory:**
```
.claude/skills/pdf-processor/SKILL.md
```

**SKILL.md:**

```markdown
---
name: "PDF Processor"
description: "Extract text and data from PDF files using pdfplumber"
version: "1.0.0"
tags: ["pdf", "extraction", "data-processing"]
---

# PDF Processor Skill

## Purpose
Extracts text, tables, and metadata from PDF files. Useful for processing invoices, reports, and documents.

## Prerequisites
Install pdfplumber:
```bash
pip install pdfplumber
```

## Instructions

When the user needs to process a PDF:

1. Install pdfplumber if not already installed
2. Create a Python script to process the PDF
3. Extract requested information (text, tables, metadata)
4. Save results to a structured format (JSON or CSV)

## Example Script

```python
import pdfplumber
import json

def process_pdf(pdf_path):
    data = {
        "text": "",
        "tables": [],
        "metadata": {}
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        # Extract metadata
        data["metadata"] = pdf.metadata
        
        # Extract text from all pages
        for page in pdf.pages:
            data["text"] += page.extract_text()
            
            # Extract tables
            tables = page.extract_tables()
            data["tables"].extend(tables)
    
    return data

# Usage
result = process_pdf("document.pdf")
print(json.dumps(result, indent=2))
```

## Tools Required
- Bash (for pip install)
- Write (for creating script)
- Read (for reading PDF path)

## Output Format
Returns JSON with:
- `text`: Full extracted text
- `tables`: List of extracted tables
- `metadata`: PDF metadata (title, author, etc.)
```

### Example: Database Query Skill

```markdown
---
name: "Database Query Helper"
description: "Generate and execute SQL queries for common database operations"
version: "1.0.0"
tags: ["database", "sql", "data"]
---

# Database Query Helper

## Purpose
Assists with generating safe SQL queries and executing database operations.

## Instructions

When the user needs database operations:

1. Understand the user's data requirements
2. Generate appropriate SQL query
3. Validate query safety (no destructive operations unless explicit)
4. Execute query using available database tools
5. Format results clearly

## Query Templates

### SELECT Operations
```sql
SELECT column1, column2
FROM table_name
WHERE condition
LIMIT 100;
```

### JOIN Operations
```sql
SELECT a.*, b.*
FROM table_a a
INNER JOIN table_b b ON a.id = b.foreign_id
WHERE condition;
```

### Aggregations
```sql
SELECT category, COUNT(*), AVG(value)
FROM table_name
GROUP BY category
ORDER BY COUNT(*) DESC;
```

## Safety Guidelines
- Always use LIMIT for production queries
- Avoid SELECT * in production
- Validate WHERE clauses
- No DELETE or DROP without explicit confirmation
- Use prepared statements for user input

## Tools Required
- Read (for schema files)
- Database tools (via MCP)
```

## Restricting Skill Tools

Limit which tools Skills can use:

```python
options = ClaudeAgentOptions(
    setting_sources=["user", "project"],
    allowed_tools=[
        "Skill",      # Enable Skills
        "Read",       # Skills can read
        "Grep",       # Skills can search
        "Glob"        # Skills can list files
        # Write and Bash excluded - Skills can't modify or execute
    ]
)
```

This creates read-only Skills.

## Skill Invocation Lifecycle

### 1. Skill Registration

When session starts with `setting_sources` configured:
- SDK scans Skill directories
- Parses `SKILL.md` frontmatter and descriptions
- Adds Skills to the `Skill` tool description

### 2. Skill Matching

When user makes a request:
- Claude reads Skill descriptions from `Skill` tool
- Uses language understanding to match request to Skill
- Decides if a Skill is relevant

### 3. Skill Invocation

If Claude determines a Skill is relevant:
- Skill instructions are injected into conversation context
- Execution context is modified (permissions, model, etc.)
- Claude follows Skill instructions

### 4. Skill Execution

Claude uses available tools following Skill instructions:
- Read supporting files if needed
- Execute steps from instructions
- Return results to user

## Testing Skills

Create a dedicated test agent:

```python
async def test_skill(skill_name: str, test_prompt: str):
    """Test a specific skill"""
    options = ClaudeAgentOptions(
        cwd="/path/to/project/with/skills",
        setting_sources=["project"],  # Only project skills
        allowed_tools=["Skill", "Read", "Write", "Bash"],
        max_turns=20
    )
    
    prompt = f"Use the {skill_name} skill: {test_prompt}"
    
    async for message in query(prompt=prompt, options=options):
        if message.type == "result":
            print(f"Result: {message.result}")

# Test PDF skill
await test_skill("PDF Processor", "Extract text from invoice.pdf")
```

## Skill Best Practices

### 1. Clear Descriptions

Make descriptions specific so Claude knows when to use the Skill:

**✅ Good:**
```yaml
description: "Extract text, tables, and metadata from PDF files using pdfplumber"
```

**❌ Vague:**
```yaml
description: "PDF tool"
```

### 2. Detailed Instructions

Provide step-by-step guidance:

```markdown
## Instructions

1. First, check if required dependencies are installed
2. If not installed, use Bash to install them
3. Create a Python script with the extraction logic
4. Run the script on the target file
5. Parse and format the output
6. Return results in JSON format
```

### 3. Include Examples

Show Claude what good usage looks like:

```markdown
## Examples

### Example 1: Extract Invoice Data
Input: "Get data from invoice.pdf"
Steps:
1. Run extraction script
2. Parse for invoice fields (date, amount, vendor)
3. Return structured JSON

### Example 2: Extract All Tables
Input: "Extract tables from report.pdf"
Steps:
1. Run extraction script
2. Export each table as separate CSV
3. Provide list of created files
```

### 4. Specify Tool Requirements

List what tools the Skill needs:

```markdown
## Tools Required
- Bash (for installing dependencies and running scripts)
- Write (for creating scripts and output files)
- Read (for reading input files and checking results)
```

### 5. Version Control Skills

Track Skill versions in frontmatter:

```yaml
version: "1.2.0"
```

Update version when making changes.

### 6. Document Limitations

Be clear about what the Skill can't do:

```markdown
## Limitations
- Only supports PDF files up to 100MB
- Cannot process password-protected PDFs
- Tables with merged cells may not extract correctly
- Requires pdfplumber 0.9.0+
```

## Advanced Skill Patterns

### Skill with Supporting Files

**Structure:**
```
.claude/skills/data-analyzer/
  ├── SKILL.md
  ├── templates/
  │   └── analysis_template.py
  └── data/
      └── sample_schema.json
```

**Reference in SKILL.md:**
```markdown
## Instructions

1. Read the template from `templates/analysis_template.py`
2. Customize it for the user's data
3. Run the analysis
4. Format results
```

### Conditional Skill Behavior

```markdown
## Instructions

If the file is a PDF:
1. Use pdfplumber extraction
2. Process with PDF-specific logic

If the file is CSV:
1. Use pandas for parsing
2. Apply data validation

Otherwise:
1. Ask user for file format
2. Adjust approach accordingly
```

### Skill Chaining

Skills can invoke other Skills:

```markdown
## Instructions

1. Use the "Data Validator" skill to check input
2. If validation passes, proceed with analysis
3. Use the "Report Generator" skill to format output
```

## SDK vs Claude Code Skills

| Aspect | SDK | Claude Code CLI |
|--------|-----|-----------------|
| **Configuration** | Programmatic via `settingSources` | Automatic from `.claude/skills/` |
| **Registration** | Filesystem only, no programmatic API | Filesystem based |
| **Tool Access** | Controlled via `allowedTools` | Controlled by permission mode |
| **Discovery** | Manual configuration required | Automatic |

**Note:** Unlike subagents (which can be defined programmatically), Skills must be created as filesystem artifacts in SDK applications.

## Debugging Skills

### Enable Verbose Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

async for message in query(prompt="...", options=options):
    print(f"Message type: {message.type}")
    print(f"Content: {message}")
```

### Check Skill Discovery

```python
async for message in query(
    prompt="List all available Skills",
    options=ClaudeAgentOptions(
        setting_sources=["user", "project"],
        allowed_tools=["Skill"]
    )
):
    if message.type == "result":
        print(message.result)
```

### Test Without Skills

Compare agent behavior with/without Skills:

```python
# With Skills
result_with = await run_query(options=ClaudeAgentOptions(
    allowed_tools=["Skill", "Read"]
))

# Without Skills  
result_without = await run_query(options=ClaudeAgentOptions(
    allowed_tools=["Read"]  # No Skill tool
))
```

## Common Issues

### Skill Not Invoked

**Causes:**
- `setting_sources` not configured
- "Skill" not in `allowed_tools`
- Skill description doesn't match user request
- SKILL.md frontmatter missing or malformed

**Solutions:**
- Verify `setting_sources=["user", "project"]`
- Add "Skill" to `allowed_tools`
- Improve Skill description specificity
- Validate YAML frontmatter syntax

### Skill Missing Tools

**Cause:** Required tools not in `allowed_tools`

**Solution:** Include all tools the Skill needs:

```python
allowed_tools=["Skill", "Read", "Write", "Bash", "Grep"]
```

## Next Steps

- **[Agents](./agents.md)** - Configure agent behavior with Skills
- **[Tools](./tools.md)** - Understand tool access for Skills
- **[Permission Modes](./permission-modes.md)** - Control Skill permissions