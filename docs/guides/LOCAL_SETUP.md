# Flint — Local Development Setup

> Instructions for configuring dependencies, credentials, and local services to run Flint.

---

## 1. Prerequisites

Ensure you have installed:
*   **Node.js 22+**
*   **Docker Desktop** (Required for local Redis execution)
*   **Slack CLI** (Recommended)
*   **Git**

---

## 2. Shared Infrastructure: Local Redis Setup

By default, Flint uses Upstash Redis for state management and deduplication caching. For local development, you should run a local Redis container to avoid serverless latency or token generation during initial setup:

1.  **Start Local Redis via Docker:**
    ```bash
    docker run --name flint-redis -p 6379:6379 -d redis
    ```
2.  **Verify Redis is Running:**
    ```bash
    docker exec -it flint-redis redis-cli ping
    # Expected output: PONG
    ```

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in the root directory by copying the template:
```bash
cp .env.example .env
```

To configure each key, follow the guidelines below:

### A. Slack Credentials & Tokens
Go to the [Slack API Apps Console](https://api.slack.com/apps) to register your development sandbox application.

*   **`SLACK_SIGNING_SECRET`**:
    *   *Location:* **Settings** -> **Basic Information** -> **App Credentials** -> **Signing Secret**.
    *   *Purpose:* Verifies that request bodies received at `/slack/events` are signed by Slack.
*   **`SLACK_APP_TOKEN` (starts with `xapp-`):**
    *   *Location:* **Settings** -> **Basic Information** -> **App-Level Tokens** -> **Generate Token**. Select the `connections:write` scope.
    *   *Purpose:* Establishes outbound WebSockets for local execution without exposing public tunnels.
*   **`SLACK_BOT_TOKEN` (starts with `xoxb-`):**
    *   *Location:* **Features** -> **OAuth & Permissions** -> **Bot Token Scopes**. Add:
        *   `app_mentions:read`
        *   `chat:write`
        *   `reactions:write`
        *   `reactions:read`
    *   Click **Install to Workspace** and copy the bot OAuth token.
*   **`SLACK_USER_TOKEN` (starts with `xoxp-`):**
    *   *Location:* **Features** -> **OAuth & Permissions** -> **User Token Scopes**. Add:
        *   `search:read`
    *   Reinstall the app and copy the User OAuth token.

### B. Anthropic Claude Client
*   **`ANTHROPIC_API_KEY` (starts with `sk-ant-`):**
    *   *Location:* [Anthropic API Console](https://console.anthropic.com/) under **API Keys**.
    *   *Purpose:* Calls Claude Sonnet for intent classification and pattern evaluation.

### C. Local Redis Configurations
*   **`UPSTASH_REDIS_REST_URL`**: Set this to point to your local Redis container:
    ```
    UPSTASH_REDIS_REST_URL=http://localhost:6379
    ```
*   **`UPSTASH_REDIS_REST_TOKEN`**: Set to any placeholder value (local Redis containers do not enforce Upstash authentication tokens):
    ```
    UPSTASH_REDIS_REST_TOKEN=local-development-placeholder
    ```

### D. Linear Client Key
*   **`LINEAR_API_KEY` (starts with `lin_api_`):**
    *   *Location:* [Linear Personal API Settings](https://linear.app/settings/api).
    *   *Purpose:* Authenticates the Linear MCP tool client.

---

## 4. Launching the App

1.  **Install project dependencies:**
    ```bash
    npm install
    ```
2.  **Start development server:**
    ```bash
    npm run dev
    ```

---

## 5. Troubleshooting & Diagnostics

### Error: `invalid_auth`
*   *Cause:* The `SLACK_BOT_TOKEN` (`xoxb-`) is incorrect, expired, or missing required scopes.
*   *Resolution:* Reinstall the app on your developer workspace and update your token.

### Error: `connect ECONNREFUSED 127.0.0.1:6379`
*   *Cause:* The local Redis container is not running.
*   *Resolution:* Start Docker Desktop and verify the container status using `docker ps`.