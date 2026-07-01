# Flint — Guardrails

> Engineering rules and constraints that preserve the quality, consistency, and architecture of the Flint codebase.

---

# Purpose

The `guardrails/` directory defines the non-negotiable engineering rules that every contributor must follow while working on Flint.

These guardrails exist to ensure that the codebase remains:

- Maintainable
- Consistent
- Readable
- Scalable
- Easy to collaborate on

They apply equally to:

- Human developers
- AI coding assistants
- Future contributors

Guardrails are not suggestions—they are project standards.

---

# Philosophy

Flint is built using an **AI-assisted development workflow**.

To keep AI-generated code consistent with the project's architecture and engineering practices, contributors should consult these guardrails before making implementation decisions.

The goal is to reduce ambiguity, prevent architectural drift, and maintain a predictable development experience.

---

# Guardrail Documents

## PROJECT_RULES.md

Defines the overall engineering philosophy of the project.

Topics include:

- Planning before implementation
- Simplicity over complexity
- Documentation expectations
- Architectural consistency
- Maintainability

---

## CODING_RULES.md

Defines the coding standards followed throughout the repository.

Topics include:

- TypeScript best practices
- File organization
- Naming conventions
- Error handling
- Logging
- Dependency management
- Code quality expectations

---

## DO_NOT_BREAK.md

Lists the project's non-negotiable constraints.

Examples include:

- Do not break contracts
- Do not refactor unrelated code
- Do not introduce circular dependencies
- Do not bypass architecture
- Do not hardcode configuration

These rules should only be violated after explicit discussion and approval.

---

# When to Read These Documents

Review the guardrails:

- Before starting a new feature
- Before refactoring existing code
- Before introducing new dependencies
- Before modifying shared interfaces
- Before making architectural decisions

When in doubt, consult the guardrails before writing code.

---

# Relationship to Other Directories

```
context/
    ↓
Defines WHAT Flint is.

guardrails/
    ↓
Defines HOW contributors should build Flint.

plans/
    ↓
Defines WHAT is currently being built.

docs/
    ↓
Explains HOW the system is implemented.

contracts/
    ↓
Defines communication between modules.
```

---

# Guiding Principle

Every implementation should align with the project's architecture, follow the established coding standards, and respect the guardrails.

Consistency is more valuable than individual preference.

---

# Related Documents

- AGENT.md
- context/
- docs/
- plans/
- contracts/