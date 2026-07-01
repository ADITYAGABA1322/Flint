# Flint — Technology Stack

> This document provides an overview of the technologies used in Flint, the role each technology plays, and the rationale behind their selection.

---

# Purpose

This document serves as the technical reference for the project's technology stack.

It answers:

- What technologies are used?
- Why were they selected?
- What role does each technology play?
- What alternatives were considered?

This document focuses on technology decisions rather than implementation details.

---

# Technology Philosophy

Flint follows a pragmatic approach when selecting technologies.

Every technology included in the stack must satisfy one or more of the following goals:

- Improve developer productivity
- Increase maintainability
- Support scalability
- Enable rapid experimentation
- Integrate well with the Slack ecosystem
- Provide strong TypeScript support
- Reduce operational complexity

Technologies are selected based on long-term architectural value rather than popularity.

---

# Core Technology Stack

| Layer | Technology | Purpose |
|---------|------------|----------|
| Language | TypeScript | Primary development language |
| Runtime | Node.js 22 | Application runtime |
| Web Framework | Express | HTTP server and API routing |
| Slack Framework | Bolt for JavaScript | Slack Events, Commands, Interactivity |
| AI Model | Claude Sonnet | Reasoning, Planning and Intent Understanding |
| Search | Slack RTS API | Workspace monitoring and contextual search |
| Integration | MCP | External tool orchestration |
| Storage | Upstash Redis | State management and caching |
| Scheduler | Upstash QStash | Background task scheduling |
| UI | Slack Block Kit | Interactive Slack experiences |

---

# Programming Language

## TypeScript

TypeScript is the primary language for Flint.

Reasons for choosing TypeScript:

- Strong type safety
- Excellent tooling
- Improved maintainability
- Superior developer experience
- Better AI-assisted development
- Large ecosystem
- First-class Node.js support

Strict TypeScript mode is enabled throughout the project.

---

# Runtime

## Node.js

Flint runs on the latest Long-Term Support version of Node.js.

Reasons:

- Excellent asynchronous programming model
- Mature ecosystem
- Native support for modern JavaScript features
- Ideal for API integrations
- Strong Slack SDK compatibility

---

# Web Framework

## Express

Express provides the HTTP server responsible for:

- Health endpoints
- Webhook handling
- Cron endpoints
- Custom APIs
- Middleware management

Express remains lightweight while providing complete control over the application's HTTP layer.

---

# Slack Framework

## Bolt for JavaScript

Bolt handles communication with Slack.

Responsibilities include:

- Event processing
- Slash commands
- Interactive actions
- Signature verification
- Event routing

Bolt is integrated using ExpressReceiver, allowing Express and Bolt to coexist within the same application.

---

# Artificial Intelligence

## Claude Sonnet

Claude serves as Flint's reasoning engine.

Primary responsibilities include:

- Intent understanding
- Context synthesis
- Planning
- Pattern analysis
- Natural language generation

Claude is responsible for reasoning, not execution.

---

# Workspace Intelligence

## Slack Real-Time Search (RTS)

The Slack RTS API enables Flint to observe workspace activity.

Responsibilities include:

- Context retrieval
- Workspace monitoring
- Semantic search
- Pattern discovery

RTS is the foundation of Flint's proactive capabilities.

---

# External Integrations

## Model Context Protocol (MCP)

MCP provides a standardized interface for external systems.

Current integrations include:

- Linear
- Notion
- Atlassian
- Asana
- Gmail

Using MCP allows Flint to interact with multiple tools through a consistent abstraction.

---

# State Management

## Upstash Redis

Redis provides lightweight persistent storage.

Primary responsibilities:

- Workspace configuration
- Pattern deduplication
- Operational memory
- Temporary caching
- Session data

Redis is intentionally limited to operational state rather than long-term business data.

---

# Background Processing

## Upstash QStash

QStash provides scheduled execution.

Typical responsibilities include:

- Periodic monitoring
- Background processing
- Retry workflows
- Scheduled maintenance

This enables serverless-friendly scheduling without maintaining dedicated workers.

---

# User Interface

## Slack Block Kit

All user-facing experiences are delivered through Block Kit.

Examples include:

- Action cards
- Status summaries
- Interactive confirmations
- Configuration views
- Proactive notifications

The interface should remain concise, actionable, and consistent with Slack's design language.

---

# Development Tooling

The project emphasizes code quality and consistency.

Core tooling includes:

- ESLint
- Prettier
- TypeScript Compiler
- Git
- npm

Additional tooling may be introduced as the project evolves.

---

# Testing Philosophy

Testing is considered a first-class engineering practice.

Testing will focus on:

- Unit tests
- Integration tests
- End-to-end workflows
- Contract validation
- Mock-based development

Every major component should be independently testable.

---

# Deployment Philosophy

Flint is designed with cloud-native deployment in mind.

Key objectives include:

- Stateless application design
- Environment-based configuration
- Scalable infrastructure
- Minimal operational overhead

Deployment details may evolve independently of the core architecture.

---

# Technology Selection Principles

When evaluating new technologies, the following questions should always be considered:

- Does it simplify the architecture?
- Does it improve developer experience?
- Does it align with the existing stack?
- Does it reduce long-term maintenance?
- Does it integrate cleanly with TypeScript?

Only technologies that provide meaningful architectural value should be adopted.

---

# Future Considerations

The technology stack is expected to evolve as Flint matures.

Potential future additions include:

- Observability platforms
- Distributed tracing
- Analytics
- Feature flags
- Additional storage backends
- Expanded MCP integrations

Any additions should follow the project's architectural principles and avoid unnecessary complexity.

---

# Related Documents

- `01_PROJECT.md`
- `02_ARCHITECTURE.md`
- `06_DECISIONS.md`
- `09_TEAM.md`