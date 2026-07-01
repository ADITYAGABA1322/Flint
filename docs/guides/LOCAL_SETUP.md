# Flint — Local Development Setup

> Instructions for setting up Flint for local development.

---

# Purpose

This guide helps contributors configure a local development environment for Flint.

---

# Prerequisites

Install:

- Node.js 22+
- npm (or pnpm)
- Git
- Docker Desktop (recommended)
- VS Code (recommended)

---

# Clone Repository

```bash
git clone <repository-url>
cd flint
```

---

# Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a local environment file.

```
.env
```

Copy values from:

```
.env.example
```

Populate all required secrets before starting the application.

---

# Start Development

```bash
npm run dev
```

---

# Verify Setup

Ensure:

- Application starts successfully.
- Environment validation passes.
- Slack connection initializes.
- Health endpoint responds.

---

# Recommended VS Code Extensions

- ESLint
- Prettier
- Error Lens
- Docker
- GitLens

---

# Troubleshooting

Common issues:

- Missing environment variables
- Invalid Slack credentials
- Redis connection failures
- MCP authentication failures

Refer to project logs for detailed error information.

---

# Next Steps

After successful setup:

1. Read the project context.
2. Review guardrails.
3. Check the current project plan.
4. Begin implementation according to the active sprint.