---
name: memory-system
description: "Manage agent memory and context persistence. Use when the user wants to (1) Save important information for future reference, (2) Retrieve past conversations or decisions, (3) Organize knowledge into structured memory, (4) Clean up or archive old memories, (5) Set up memory maintenance workflows."
---

# Memory System

Structured memory management for OpenClaw agents.

## Memory Hierarchy

```
memory/
├── YYYY-MM-DD.md          # Daily logs (auto-created)
├── INDEX.md               # Memory index and navigation
├── STATE.md               # Current session state
├── TASKS.md               # Active and pending tasks
├── MEMORY.md              # Long-term curated memories
├── people/                # Person profiles
│   └── {person_id}.md
├── projects/              # Project contexts
│   └── {project_name}.md
└── weekly/                # Weekly summaries
    └── YYYY-W##.md
```

## Core Operations

### 1. Save to Daily Log

```javascript
// Auto-append to memory/YYYY-MM-DD.md
{
  "timestamp": "ISO 8601",
  "type": "event|decision|insight|error",
  "content": "What happened",
  "context": "Relevant background",
  "action_items": ["todo1", "todo2"]
}
```

### 2. Update Long-term Memory (MEMORY.md)

```markdown
## User Preferences
- Name: {name}
- Communication style: {style}
- Important dates: {dates}

## Key Decisions
- [DATE] Decision: {what} | Reason: {why}

## Lessons Learned
- {insight} (from {context})
```

### 3. Create Person Profile

```markdown
# {person_id}

## Identity
- Name: 
- Role/Relationship:
- First contact: {date}

## Context
- Communication style:
- Important topics:
- Preferences:

## History
- [DATE] {event}
```

### 4. Project Context

```markdown
# {project_name}

## Overview
- Goal:
- Status: active|paused|completed
- Start date:

## Key Files
- {path}: {description}

## Decisions
- [DATE] {decision}

## Next Steps
- [ ] {task}
```

## Maintenance Workflows

### Daily
- Append significant events to daily log
- Update STATE.md with current focus

### Weekly
- Review daily logs
- Create weekly summary
- Archive completed tasks
- Update MEMORY.md with distilled insights

### Monthly
- Review all person profiles
- Clean up obsolete memories
- Consolidate project contexts

## Best Practices

1. **Always write it down** - Mental notes don't survive restarts
2. **Use daily logs for raw data** - MEMORY.md is for distilled wisdom
3. **Link memories** - Use references between files
4. **Keep it searchable** - Use consistent keywords
5. **Review periodically** - Memory is useless if forgotten

## Quick Commands

```bash
# Check today's log
cat memory/$(date +%Y-%m-%d).md

# Update MEMORY.md
edit memory/MEMORY.md

# Create person profile
echo "# {id}" > memory/people/{id}.md

# List all projects
ls memory/projects/
```

## Integration with Sessions

Session files (`.jsonl`) contain full conversation history but are:
- Hard to search
- Expensive to load
- Not human-readable

Memory system extracts **actionable knowledge** from sessions into structured, searchable, human-readable files.

## Migration

When moving to new environment:
1. Copy `memory/` directory
2. Copy `MEMORY.md`
3. Session files optional (heavy, can archive)
