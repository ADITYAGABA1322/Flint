# Flint — Do Not Break

> These are absolute rules that should never be violated without explicit approval.

---

# Never Change Without Approval

- Repository structure
- Core architecture
- Contracts
- Public interfaces
- Folder organization

---

# Never Refactor Unrelated Code

When implementing a feature:

Do not modify unrelated modules simply because improvements are possible.

Keep changes focused.

---

# Never Introduce Circular Dependencies

Modules should remain independent.

Circular imports are prohibited.

---

# Never Use "any"

TypeScript strict mode exists for a reason.

Use proper types.

---

# Never Duplicate Logic

If logic already exists:

- reuse it
- extend it
- extract shared functionality

Avoid copy-paste implementations.

---

# Never Hardcode Configuration

Configuration belongs in:

- environment variables
- config modules
- defaults

Never inside implementation code.

---

# Never Skip Error Handling

Every external operation should handle:

- network failures
- invalid responses
- unexpected exceptions

---

# Never Ignore Logging

Important operations should be logged.

Logs should provide useful debugging information without exposing sensitive data.

---

# Never Merge Unreviewed Architecture Changes

Architecture changes require:

- documentation updates
- implementation plan
- review

---

# Never Sacrifice Maintainability for Speed

Hackathon deadlines are important.

Maintainable software is more important.

Every shortcut should have a documented reason.

---

# Final Rule

If unsure:

Stop.

Review the documentation.

Understand the architecture.

Then continue.