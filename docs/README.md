# Flint Engineering Documentation

> This directory contains the engineering documentation for Flint.

Unlike the `context/` directory, which explains the product vision and project knowledge, the `docs/` directory explains **how Flint is designed, developed, and maintained**.

---

# Purpose

This documentation exists to help contributors understand the technical implementation of Flint.

It should answer questions such as:

- How is the system architected?
- How should new features be implemented?
- What coding standards should be followed?
- How is the repository organized?
- How can a developer set up the project locally?

This documentation is intended for both human developers and AI coding assistants.

---

# Directory Structure

```
docs/
│
├── README.md
│
├── architecture/
│   ├── SYSTEM_OVERVIEW.md
│   ├── REQUEST_LIFECYCLE.md
│   ├── PROACTIVE_WORKFLOW.md
│   ├── REACTIVE_WORKFLOW.md
│   ├── DATA_FLOW.md
│   └── ERROR_HANDLING.md
│
├── standards/
│   ├── CODING_STANDARDS.md
│   ├── FOLDER_STRUCTURE.md
│   ├── NAMING_CONVENTIONS.md
│   ├── GIT_WORKFLOW.md
│   ├── REVIEW_CHECKLIST.md
│   └── DOCUMENTATION_STANDARDS.md
│
├── guides/
│   ├── LOCAL_SETUP.md
│   ├── SLACK_SETUP.md
│   ├── MCP_SETUP.md
│   └── DEPLOYMENT.md
│
└── api/
    ├── SLACK_EVENTS.md
    └── MCP_INTERFACES.md
```

---

# Documentation Categories

## Architecture

Describes the high-level technical design of Flint.

Topics include:

- overall system design
- request lifecycle
- proactive monitoring
- reactive workflows
- data flow
- error handling

---

## Standards

Defines engineering practices followed throughout the project.

These include:

- coding standards
- repository structure
- naming conventions
- Git workflow
- documentation expectations
- review checklist

---

## Guides

Provides step-by-step instructions for contributors.

Examples:

- local development
- Slack configuration
- MCP setup
- deployment

---

## API

Documents the interfaces used by Flint.

This includes:

- Slack Events
- MCP interfaces
- internal contracts (where applicable)

---

# Documentation Principles

Engineering documentation should be:

- Accurate
- Concise
- Up-to-date
- Easy to navigate
- Focused on implementation rather than product vision

Documentation should evolve alongside the codebase.

---

# Before Writing Code

Every contributor should understand:

1. Project Context (`/context`)
2. Project Rules (`/guardrails`)
3. Active Plans (`/plans`)
4. Relevant Engineering Documentation (`/docs`)

Understanding the architecture before implementation is expected.

---

# Updating Documentation

Documentation should be updated whenever:

- architecture changes
- public interfaces change
- setup instructions change
- development workflow changes
- engineering standards evolve

Minor implementation details do not require documentation updates.

---

# Related Directories

- `/context` — Product knowledge and project context
- `/guardrails` — Engineering rules and constraints
- `/plans` — Active implementation plans
- `/contracts` — Shared interfaces