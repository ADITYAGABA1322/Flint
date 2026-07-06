# Flint — Local Development Setup Guide

This guide provides instructions for configuring credentials, environment variables, and services to run Flint.

---

## 1. Prerequisites

Ensure you have installed:
*   **Node.js 22+**
*   **Git**
*   A dedicated **Slack Sandbox Workspace** where you are an Administrator.

---

## 2. Environment Configuration (`.env`)

Create a `.env` file in the root directory by copying the template:
```bash
cp .env.example .env
```

Configure the following variables:

### A. Slack Credentials & Tokens
Go to the [Slack Developer Console](https://api.slack.com/apps) and configure your app.

*   **`SLACK_SIGNING_SECRET`**:
    *   *Location:* **Settings** -> **Basic Information** -> **App Credentials** -> **Signing Secret**.
    *   *Purpose:* Verifies that request bodies received by Bolt are signed by Slack.
*   **`SLACK_APP_TOKEN` (starts with `xapp-`):**
    *   *Location:* **Settings** -> **Basic Information** -> **App-Level Tokens** -> **Generate Token**. Add the `connections:write` scope.
    *   *Purpose:* Establishes Socket Mode WebSocket connections for local execution.
*   **`SLACK_BOT_TOKEN` (starts with `xoxb-`):**
    *   *Location:* **Features** -> **OAuth & Permissions** -> **Bot Token Scopes**. Add:
        *   `app_mentions:read`
        *   `chat:write`
        *   `reactions:write`
    *   Click **Install to Workspace** and copy the bot OAuth token.
*   **`SLACK_USER_TOKEN` (starts with `xoxp-`):**
    *   *Location:* **Features** -> **OAuth & Permissions** -> **User Token Scopes**. Add:
        *   `search:read` (Required for RTS cross-channel search context).
    *   Reinstall the app to apply the user scopes and copy the User OAuth token.

### B. NVIDIA Mistral AI Client
*   **`NVIDIA_API_KEY` (starts with `nvapi-`):**
    *   *Location:* [NVIDIA Build Console](https://build.nvidia.com/) API dashboard.
    *   *Purpose:* Authenticates Mistral completions for intent classification.
*   **`NVIDIA_API_URL`**: Set to `https://integrate.api.nvidia.com/v1`
*   **`NVIDIA_API_MODEL`**: Set to the target LLM model name (e.g., `openai/gpt-oss-120b`).

### C. Serverless Redis (Upstash)
*   **`UPSTASH_REDIS_REST_URL`**:
    *   *Location:* [Upstash Console](https://console.upstash.com/) Redis Database details page.
    *   *Purpose:* HTTP REST URL for state storage and deduplication.
*   **`UPSTASH_REDIS_REST_TOKEN`**:
    *   *Location:* Upstash Redis credentials console.

### D. Integration Credentials

#### Linear
*   **`LINEAR_API_KEY` (starts with `lin_api_`):**
    *   *Location:* **Linear Settings** -> **Account** -> **API** -> **Personal API Keys**.
    *   *Purpose:* Authenticates the Linear MCP tool.

#### Notion
*   **`NOTION_API_KEY` (starts with `secret_`):**
    *   *Location:* [Notion Integrations](https://www.notion.so/my-integrations). Create a new internal integration and copy the token.
*   **`NOTION_DATABASE_ID` (32-character string):**
    *   *Location:* Extracted from the URL of your Notion database page: `https://www.notion.so/workspace/`**`[database_id]`**`?v=...`
    *   *Important:* Remember to invite your Flint integration to the database page via the page's top-right `...` menu under **Add connections**.

#### Asana
*   **`ASANA_ACCESS_TOKEN`**:
    *   *Location:* [Asana Developer Console](https://app.asana.com/0/developer-console) -> **Personal Access Tokens**.
*   **`ASANA_PROJECT_ID` (numeric string):**
    *   *Location:* Extracted from your Asana board URL: `https://app.asana.com/0/`**`[project_id]`**`/list`.

---

## 3. Launching the App

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the development server:**
    ```bash
    npm run dev
    ```
3.  **Run automated tests:**
    ```bash
    npm run test
    ```