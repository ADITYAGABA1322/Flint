# Flint — Folder Structure

> Repository organization guidelines.

---

# Purpose

A predictable folder structure improves navigation, onboarding, and long-term maintainability.

---

# Root Structure

```
context/
contracts/
docs/
guardrails/
plans/
prompts/
src/
tests/

README.md
AGENT.md
```

---

# Source Code

```
src/

app/
config/
handlers/
intent/
planner/
monitor/
tools/
store/
blocks/
types/
utils/
```

Each directory should represent a single architectural concern.

---

# Documentation

Project knowledge belongs in:

```
context/
```

Engineering documentation belongs in:

```
docs/
```

Rules belong in:

```
guardrails/
```

Implementation planning belongs in:

```
plans/
```

---

# Naming

Directories:

- lowercase
- descriptive
- singular where appropriate

Files:

- PascalCase for classes
- camelCase for utilities
- UPPER_CASE.md for documentation

---

# Module Organization

Avoid dumping unrelated files into a single directory.

When a module grows:

```
intent/

IntentEngine.ts
PromptBuilder.ts
Classifier.ts
Confidence.ts
```

is preferred over:

```
intent.ts
```

containing everything.

---

# Future Growth

As Flint evolves, new modules should integrate naturally into the existing structure rather than introducing inconsistent layouts.

Consistency is more important than personal preference.