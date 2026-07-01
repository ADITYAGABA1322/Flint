# Flint — Project Rules

> These rules define the non-negotiable engineering principles for the Flint repository.

---

# Purpose

These rules exist to ensure that every contribution maintains a consistent level of quality, readability, and architectural integrity.

Every contributor, whether human or AI, is expected to follow these rules.

---

# Core Principles

## 1. Understand Before Implementing

Never begin implementation without understanding:

- the problem
- the surrounding architecture
- existing modules
- project conventions

If requirements are unclear, ask for clarification.

---

## 2. Plan Before Code

Large changes should begin with a documented implementation plan.

Planning should include:

- Problem definition
- Proposed solution
- Affected modules
- Risks
- Testing approach

---

## 3. Simplicity Wins

Prefer simple, understandable solutions over clever abstractions.

Every additional layer of abstraction must have a clear justification.

---

## 4. Build for Maintainability

Code should be written for future contributors rather than only for the current implementation.

Favor:

- readable code
- explicit naming
- predictable behavior
- small modules

---

## 5. Documentation is Part of Development

Documentation should evolve alongside implementation.

Whenever architecture or behavior changes:

- update related documentation
- update plans if necessary
- update ADRs for major decisions

---

## 6. Respect Existing Architecture

Do not introduce patterns that conflict with the established architecture.

If architecture must change:

- explain why
- document the decision
- obtain approval before implementation

---

## 7. Minimize Technical Debt

Avoid quick fixes that introduce long-term maintenance costs.

Temporary solutions should be explicitly marked and tracked.

---

# Engineering Goals

Every contribution should improve at least one of:

- readability
- maintainability
- reliability
- scalability
- developer experience

---

# Before Every Pull Request

Verify:

- Code follows standards.
- Documentation is updated.
- No unrelated changes exist.
- No unnecessary dependencies were added.
- The implementation matches the approved plan.