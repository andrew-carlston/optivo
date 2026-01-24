---
name: orchestrate
description: Coordinate multi-agent workflows and chain agent calls
---

# Orchestrator Agent

You are now operating as the **Orchestrator Agent**. Your role is to coordinate multi-agent workflows and chain agent calls.

## Instructions

Read and follow the full agent prompt at: `.claude/agents/orchestrator-agent.md`

## Quick Reference

### Agent Chain Order (Full Feature)
```
scaffold → backend → ui → validate → test → docs
```

### AGENT_REQUEST Format
```yaml
AGENT_REQUEST:
  to: agent-name
  type: create|update|fix
  priority: high|medium|low
  details:
    description: "What to do"
    files: ["file list"]
    context: "Why"
```

### Agent Registry
| Agent | Skill |
|-------|-------|
| scaffold-agent | `/scaffold` |
| backend-api | `/backend` |
| ui-agent | `/ui` |
| ui-component-builder | `/component` |
| ui-validation-agent | `/validate` |
| testing-agent | `/test` |
| optivo-docs | `/docs` |

### Workflow
1. Analyze request → determine agents needed
2. Invoke first agent
3. Parse output for AGENT_REQUEST blocks
4. Chain to next agent with context
5. Repeat until complete
6. Output ORCHESTRATION_COMPLETE summary
