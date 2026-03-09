---
name: todo-manager
description: Extract TODO/FIXME comments from code and manage task lists. Use when you need to find todos in codebase, generate task lists, or sync code todos to external task systems.
---
# Todo Manager Skill

Scans codebases to extract TODO/FIXME comments with metadata:
- Task description
- Author (if specified with @author)
- Timestamp (if specified)
- Priority (high/medium/low with ! markers)
- File path and line number

## Supported formats
```javascript
// TODO: Implement user authentication
// FIXME: @leo Fix memory leak in API endpoint !high
// TODO: Add unit tests for login flow @2026-03-15
```

## Usage
```javascript
const todoManager = require('./skills/todo-manager');
const todos = await todoManager.scan('/path/to/repo');
console.log(todos.summary);
```

## CLI
```bash
node skills/todo-manager/index.js <path> [--verbose] [--dry-run] [--output <file>]
```
