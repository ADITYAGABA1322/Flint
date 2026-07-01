# Flint — System Overview

> High-level architecture of the Flint platform.

---

# Purpose

This document provides a high-level overview of Flint's architecture.

It explains the major system components, how they interact, and the responsibilities of each layer.

This document intentionally avoids implementation details and instead focuses on architectural design.

---

# System Vision

Flint is a proactive, domain-aware Slack AI agent that continuously monitors engineering activity, detects workflow friction, reasons about context, and orchestrates actions across multiple external platforms.

Unlike traditional chatbots, Flint is event-driven and proactive.

---

# High-Level Architecture

```
                    Slack Workspace
                          │
                          ▼
                 Slack Events / RTS API
                          │
                          ▼
                 Slack Bolt + Express
                          │
                          ▼
                   Intent Engine
                          │
                          ▼
                  Context Builder
                          │
                          ▼
                       Planner
                          │
                          ▼
                MCP Orchestrator
        ┌──────────┬──────────┬──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼
     Linear     Notion      Jira      Asana      Gmail
                          │
                          ▼
                    Block Kit Response
                          │
                          ▼
                         Slack
```

---

# Core Components

## Slack Layer

Responsible for:

- Receiving Slack events
- Slash commands
- Mentions
- Interactive actions
- RTS monitoring

---

## Intent Engine

Determines what Flint should do.

Responsibilities include:

- Intent classification
- Conversation understanding
- Confidence scoring

---

## Context Builder

Collects information required before making decisions.

Possible sources include:

- Slack history
- RTS search
- Redis cache
- External services

---

## Planner

Generates an execution plan.

Determines:

- Required actions
- Tool selection
- Execution order
- Risk assessment

---

## MCP Orchestrator

Executes actions across connected tools.

Supports:

- Linear
- Notion
- Atlassian
- Asana
- Gmail

---

## Workspace Memory

Stores operational state.

Examples:

- Pattern cache
- Deduplication
- Workspace configuration
- Monitoring state

---

# Architectural Principles

- Modular design
- Strong typing
- Clear separation of concerns
- Contract-first development
- Extensible integrations
- Minimal coupling
- High cohesion

---

# Design Goals

The architecture should remain:

- Easy to understand
- Easy to extend
- Easy to test
- Easy to maintain

Every new feature should integrate into the existing architecture rather than changing it.

---

# Related Documents

- context/02_ARCHITECTURE.md
- docs/standards/CODING_STANDARDS.md
- contracts/