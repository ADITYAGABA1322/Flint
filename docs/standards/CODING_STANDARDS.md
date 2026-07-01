# Flint — Coding Standards

> Engineering standards followed throughout the Flint codebase.

---

# Purpose

These standards ensure that every contribution remains consistent, readable, maintainable, and production-ready.

---

# General Principles

- Prioritize readability over cleverness.
- Prefer explicit code over implicit behavior.
- Write code for future contributors.
- Keep implementations simple.

---

# TypeScript

- Strict mode must remain enabled.
- Never use `any`.
- Prefer interfaces for contracts.
- Use enums only when appropriate.
- Export named members instead of defaults where practical.

---

# Functions

- Keep functions focused on a single responsibility.
- Avoid deeply nested logic.
- Return early when possible.
- Avoid unnecessary side effects.

---

# Classes

Use classes only when they represent meaningful domain concepts.

Prefer composition over inheritance.

---

# Error Handling

Never silently ignore errors.

Errors should:

- provide meaningful messages
- be logged appropriately
- propagate when recovery is not possible

---

# Logging

Logs should be:

- structured
- concise
- meaningful

Never log secrets or sensitive information.

---

# Dependencies

Before adding a dependency ask:

- Is it necessary?
- Can existing utilities solve the problem?
- Does it increase maintenance burden?

---

# Comments

Code should be self-explanatory.

Write comments only when explaining:

- architectural decisions
- non-obvious logic
- trade-offs

Avoid commenting obvious code.

---

# File Size

Guidelines:

- Functions: preferably under 50 lines
- Classes: preferably under 250 lines
- Files: preferably under 400 lines

Split modules when responsibilities grow.

---

# Definition of Done

Before considering work complete:

- Code builds
- Lint passes
- Types pass
- Documentation updated
- Related plans updated if necessary