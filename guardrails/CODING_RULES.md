# Flint — Coding Rules

> These rules define the coding standards that every contributor and AI assistant must follow while developing Flint.

---

# Purpose

The objective of these rules is to ensure that the codebase remains:

- Readable
- Consistent
- Maintainable
- Extensible
- Production-ready

These rules apply to every source file in the repository.

---

# Core Principles

## Readability Over Cleverness

Write code that another developer can understand quickly.

Prefer straightforward implementations over overly clever solutions.

Code is read more often than it is written.

---

## Simplicity First

Always implement the simplest solution that correctly solves the problem.

Avoid unnecessary abstractions.

Do not optimize prematurely.

---

## Single Responsibility

Every module should have one clearly defined responsibility.

Examples:

✓ IntentEngine → Understands intent

✓ Planner → Creates execution plans

✓ MCPOrchestrator → Executes actions

✗ One module performing all three responsibilities

---

## Explicit Over Implicit

Prefer code that clearly communicates its intent.

Examples:

- descriptive variable names
- explicit return values
- predictable control flow

Avoid hidden behavior.

---

# TypeScript Rules

Strict mode must remain enabled.

---

## Never Use `any`

Use:

- interfaces
- type aliases
- generics
- unknown (when appropriate)

instead of `any`.

---

## Strong Typing

Every function should have explicit parameter and return types.

Public APIs should always be typed.

---

## Interfaces First

Use interfaces for shared contracts whenever possible.

Shared interfaces belong inside the `contracts/` directory.

---

## Null Safety

Always account for:

- null
- undefined
- optional values

Never assume data exists.

---

# Functions

Functions should:

- perform one task
- have descriptive names
- avoid side effects where possible
- remain small and easy to understand

Prefer early returns over nested conditionals.

---

# Classes

Create classes only when they represent meaningful domain concepts.

Avoid utility classes with unrelated methods.

Favor composition over inheritance.

---

# File Organization

Keep related code together.

Avoid files that continuously grow without structure.

When a module becomes too large, split it into focused components.

---

# Error Handling

Never silently swallow exceptions.

Errors should:

- provide meaningful context
- be logged appropriately
- propagate when recovery is impossible

Avoid empty catch blocks.

---

# Logging

Logs should help developers understand system behavior.

Good logs include:

- operation
- context
- outcome

Never log:

- secrets
- API keys
- tokens
- passwords

---

# Dependencies

Before adding a dependency, ask:

1. Is it necessary?
2. Can existing code solve the problem?
3. Does it align with the project architecture?
4. Will it increase long-term maintenance?

Favor lightweight dependencies.

---

# Comments

Write code that is self-explanatory.

Use comments only to explain:

- architectural decisions
- business reasoning
- non-obvious algorithms
- important trade-offs

Do not comment obvious code.

---

# Naming

Choose names that clearly communicate intent.

Prefer:

```
createExecutionPlan()
```

over

```
run()
```

Prefer:

```
workspaceConfiguration
```

over

```
cfg
```

Avoid abbreviations unless they are universally understood.

---

# Asynchronous Code

Use async/await instead of chained promises.

Always handle rejected promises.

Run independent operations in parallel only when they are truly independent.

---

# Code Reuse

Avoid duplication.

If similar logic appears multiple times:

- extract a reusable function
- create a shared utility
- reuse existing modules

Copy-paste should be the last resort.

---

# Configuration

Never hardcode:

- secrets
- URLs
- environment values
- ports
- credentials

All configuration should come from the configuration layer.

---

# Testing Mindset

Even before automated tests exist, code should be written to be testable.

Prefer:

- dependency injection
- pure functions
- isolated modules

Avoid tightly coupled implementations.

---

# Definition of Done

Before considering implementation complete:

- Code compiles successfully.
- Lint passes.
- Types pass.
- Existing architecture is respected.
- Documentation is updated if required.
- No unrelated files were modified.
- The implementation follows the approved plan.

---

# Final Principle

Every contribution should leave the codebase better than it was found.

Small improvements made consistently produce a maintainable system over time.