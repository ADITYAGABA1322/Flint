# Flint — Team & Development Philosophy

> This document defines the engineering philosophy, collaboration principles, and development expectations followed throughout the Flint project.

---

# Purpose

This document establishes how Flint should be built.

It defines the project's engineering culture rather than implementation details.

Every contributor—human or AI—is expected to follow these principles.

---

# Core Philosophy

Flint is intended to be more than a hackathon project.

The objective is to build a repository that demonstrates professional engineering practices while remaining adaptable and easy to extend.

Every engineering decision should balance:

- Simplicity
- Maintainability
- Scalability
- Developer Experience
- AI Collaboration

---

# Guiding Principles

## Architecture Before Implementation

Major architectural decisions should be planned and reviewed before code is written.

---

## Understand Before Building

Contributors should understand the surrounding context before implementing new functionality.

Avoid writing isolated solutions without considering the broader system.

---

## Modular Design

Every module should have a single responsibility.

Large components should be decomposed into smaller, focused modules as the project evolves.

---

## Explicit Over Implicit

Prefer code and documentation that are easy to understand rather than clever or overly abstract.

Readability is a feature.

---

## Composition Over Complexity

Favor composing small, focused components instead of introducing unnecessary inheritance or tightly coupled structures.

---

## Documentation as a First-Class Citizen

Documentation is considered part of the product.

Whenever significant architectural or product changes occur, the relevant documentation should be updated.

---

# Development Workflow

Every major task should follow a consistent lifecycle.

1. Understand the problem.
2. Review existing documentation.
3. Analyze dependencies.
4. Create an implementation plan.
5. Review the plan.
6. Implement.
7. Test.
8. Update documentation.
9. Merge.

Skipping planning or documentation should be the exception, not the rule.

---

# Engineering Standards

The project should prioritize:

- Clear architecture
- Strong typing
- Small modules
- Predictable behavior
- Explicit naming
- Reusable components
- Minimal coupling
- High cohesion

Detailed coding standards are documented separately under `/docs`.

---

# AI Collaboration

AI assistants are expected to behave as engineering collaborators.

They should:

- Read project context before generating code.
- Respect established architecture.
- Avoid unnecessary refactoring.
- Explain architectural decisions.
- Request clarification when requirements are ambiguous.

AI should assist engineering—not replace thoughtful design.

---

# Code Review Mindset

Before approving changes, contributors should ask:

- Does this align with the architecture?
- Is the solution understandable?
- Does it introduce unnecessary complexity?
- Can it be extended later?
- Is the documentation still accurate?

---

# Long-Term Vision

The repository should remain approachable for future contributors.

A new developer should be able to understand the project by reading the documentation before exploring the source code.

The goal is to reduce tribal knowledge and make engineering decisions transparent.

---

# Related Documents

- 00_INDEX.md
- 02_ARCHITECTURE.md
- 06_DECISIONS.md
- docs/standards/