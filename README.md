# 🔥 Flint

> **Flint sparks action from friction — before you even know to ask.**

Flint is a proactive, domain-aware Slack AI agent that continuously monitors engineering workflows, detects friction, and orchestrates actions across multiple productivity tools from a single Slack workspace.

Unlike traditional assistants that wait for user prompts, Flint proactively identifies issues such as stale pull requests, recurring bugs, blocked releases, and unanswered decisions, then recommends or executes the appropriate actions.

Built for the **Slack Agent Builder Challenge 2026**.

---

# Vision

Engineering teams spend too much time reacting to problems after they occur.

Flint changes that by continuously understanding the workspace and acting before workflow friction becomes a bottleneck.

The goal is to make Slack an intelligent operating system for engineering teams rather than simply a communication platform.

---

# Core Capabilities

- 🔍 Proactive workspace monitoring using Slack RTS
- 🤖 AI-powered intent understanding
- ⚡ Multi-tool orchestration through MCP
- 🧠 Cross-platform context synthesis
- 💬 Interactive Slack Block Kit experiences
- 📈 Workflow intelligence for engineering teams

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Language | TypeScript |
| Runtime | Node.js 22 |
| Server | Express |
| Slack | Bolt (ExpressReceiver) |
| AI | Anthropic Claude Sonnet |
| Integrations | MCP |
| Storage | Upstash Redis |
| Scheduler | Upstash QStash |
| UI | Slack Block Kit |

---

# Repository Structure

```
.
├── context/         # Project knowledge and product context
├── docs/            # Engineering documentation
├── guardrails/      # Development rules and engineering standards
├── plans/           # Planning and implementation roadmap
├── contracts/       # Shared interfaces and contracts
├── src/             # Application source code
├── tests/           # Tests
│
├── AGENT.md         # AI development guide
└── README.md
```

---

# Getting Started

If you're new to the project, read the repository in the following order:

1. `README.md`
2. `AGENT.md`
3. `context/`
4. `guardrails/`
5. `plans/`
6. `docs/`
7. `contracts/`

Understanding the project before implementation is expected.

---

# Development Philosophy

Flint follows a planning-first, architecture-driven development workflow.

Every implementation should:

- Understand the problem before writing code.
- Respect the established architecture.
- Follow the project guardrails.
- Prioritize maintainability over speed.
- Keep modules small, focused, and composable.

---

# Current Status

The project is currently in the **Planning & Architecture** phase.

The repository foundation has been established, and implementation will proceed incrementally following the project roadmap.

---

# Contributing

Before contributing:

- Review the project context.
- Read the guardrails.
- Check the active project plan.
- Understand the architecture before making changes.

---

# License

This project is developed as part of the **Slack Agent Builder Challenge 2026**.
