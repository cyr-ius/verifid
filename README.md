# 🛡️ VerifID

**VerifID** is a self-hosted employee identity verification portal powered by **Microsoft Entra Verified ID**.
It enables HR teams to issue verifiable credentials to employees and helpdesk agents to verify employee identities without passwords — using a QR code and Microsoft Authenticator.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Flows](#flows)
- [Environment Variables](#environment-variables)
- [Azure App Registrations](#azure-app-registrations)
  - [App 1 — Backend API App Registration](#app-1--backend-api-app-registration)
  - [App 2 — Frontend SPA App Registration](#app-2--frontend-spa-app-registration)
  - [Summary Table](#summary-table)
- [Roles & Permissions](#roles--permissions)
- [Development](#development)
- [CI / CD](#ci--cd)
- [License](#license)

---

## Features

- 🪪 **Credential Issuance** — HR issues a `VerifiedEmployee` verifiable credential directly into the employee's Microsoft Authenticator wallet
- 🔍 **Identity Verification** — Helpdesk agents generate a QR code; the employee scans it to prove their identity in seconds
- 📟 **Assistance Code** — A short 4-digit code shared verbally with the helpdesk to look up a verification result without needing a session ID
- 🔐 **Azure Entra ID authentication** — Optional JWT-based access control with role and scope enforcement (`helpdesk`, `hr`)
- 📱 **Mobile-first UI** — Responsive Angular 21 frontend, installable as a PWA
- 🐳 **Single-container deployment** — Frontend and backend bundled in one Docker image
- 🔒 **Security headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy applied on every response

---

## Architecture

| Layer          | Technology                                                          |
| -------------- | ------------------------------------------------------------------- |
| **Frontend**   | Angular 21 — Signals, Signal Forms, Zoneless, Standalone Components |
| **Styling**    | Bootstrap 5.3 + Bootstrap Icons 1.13                                |
| **Backend**    | FastAPI 0.135 + Python 3.14 (fully async)                           |
| **Validation** | Pydantic v2                                                         |
| **Identity**   | Microsoft Entra Verified ID (Request Service API)                   |
| **Auth**       | MSAL (frontend) + python-jose JWT validation (backend)              |
| **Container**  | Single-stage Docker image — `python:3.14-alpine`                    |

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│                                             │
│  ┌──────────────┐   ┌─────────────────────┐ │
│  │   Angular    │   │      FastAPI        │ │
│  │  (static     │◄──│   /api/v1/...       │ │
│  │   files)     │   │                     │ │
│  └──────────────┘   └────────┬────────────┘ │
└───────────────────────────────┼─────────────┘
                                │
              ┌─────────────────▼──────────────┐
              │  Microsoft Entra Verified ID   │
              │  (verifiedid.did.msidentity.com)│
              └────────────────────────────────┘
```

---

## Prerequisites

- Docker 24+ (or compatible runtime)
- Docker Compose v2 _(optional)_
- A Microsoft Azure tenant with:
  - Microsoft Entra Verified ID enabled and configured
  - Two App Registrations (see [Azure App Registrations](#azure-app-registrations))
  - A published `VerifiedEmployee` credential type

---

## Quick Start

### Docker CLI

```bash
docker run -d \
  --name verifid \
  -p 8000:8000 \
  -e AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e AZURE_CLIENT_SECRET=your-client-secret \
  -e VERIFIED_ID_DID=did:web:yourdomain.com \
  -e VERIFIED_ID_CONTRACT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  -e APP_BASE_URL=https://yourdomain.com \
  -e API_KEY=your-api-key \
  -e AUTH_CLIENT_ID=xxxxxxx-xxx-xxxx-xxxx-xxxxxxxxxxxx \
  ghcr.io/cyr-ius/verifid:latest
```

Open **http://localhost:8000** to access the portal.

### Docker Compose

```yaml
services:
  verifid:
    image: ghcr.io/cyr-ius/verifid:latest
    container_name: verifid
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}
      - VERIFIED_ID_DID=${VERIFIED_ID_DID}
      - VERIFIED_ID_CONTRACT_ID=${VERIFIED_ID_CONTRACT_ID}
      - APP_BASE_URL=${APP_BASE_URL}
      - API_KEY=${API_KEY}
      - AUTH_CLIENT_ID=${AUTH_CLIENT_ID}
```

Then create a `.env` file from the provided example:

```bash
cp backend/.env.example .env
# Edit .env with your actual values
docker compose up -d
```

---

## Flows

### Verification (Helpdesk)

1. The helpdesk agent opens **`/verify`** and clicks **Start verification**
2. VerifID calls the Verified ID Request Service and generates a QR code
3. A **4-digit assistance code** is displayed prominently — the employee communicates it verbally to the agent
4. The employee scans the QR code with **Microsoft Authenticator** and confirms credential sharing
5. The helpdesk UI polls until the credential is verified and displays the employee's claims
6. Alternatively, the agent can look up the result later via the **`/assist`** dashboard using the assistance code

### Issuance (HR)

1. An HR agent opens **`/issue`** (requires `hr` role)
2. They fill in the employee's details: name, employee ID, job title, department
3. VerifID generates a QR code — the employee scans it with Microsoft Authenticator
4. The `VerifiedEmployee` credential is stored in the employee's wallet, ready to be presented to the helpdesk

---

## Environment Variables

### Required

| Variable              | Description                                                                    |
| --------------------- | ------------------------------------------------------------------------------ |
| `AZURE_TENANT_ID`     | Azure Active Directory tenant ID                                               |
| `AZURE_CLIENT_ID`     | Client ID of the **Backend API** app registration  (Verif ID API interface)    |
| `AZURE_CLIENT_SECRET` | Client secret for the backend app registration                                 |
| `VERIFIED_ID_DID`     | Your Verified ID authority DID (e.g. `did:web:yourdomain.com`)                 |
| `VERIFIED_ID_CONTRACT_ID` | Credential contract ID used to build the Verified ID issuance manifest URL |
| `APP_BASE_URL`        | Public HTTPS base URL of the application — used by Microsoft to POST callbacks |
| `API_KEY`             | Shared secret that Microsoft must include in callback headers                  |
| `AUTH_CLIENT_ID`.     | Client ID of the **Frontend SPA** app registration (Verif ID interface)        |           

### Authentication

| Variable                        | Description                                      | Default           |
| ------------------------------- | ------------------------------------------------ | ----------------- |
| `AUTH_ENABLED`                  | Enable JWT authentication on protected endpoints | `True`            |
| `AUTH_AUDIENCE`                 | Comma-separated accepted JWT audiences           | `AZURE_CLIENT_ID` |
| `AUTH_SCOPE                   ` | Delegated scope accepted for helpdesk access     | `access_as_user`  |
| `AUTH_JWKS_CACHE_TTL_SECONDS`   | Time to cache JWKS keys (reduce latency)         | `3600`            |

### Feature Flags

| Variable         | Description                                     | Default     |
| ---------------- | ----------------------------------------------- | ----------- |
| `SWAGGER_ENABLE` | Expose `/api/docs` and `/api/openapi.json`      | `False`     |
| `LOG_LEVEL`      | Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO`      |
| `LOGO_URL`       | URL of the logo displayed in the navigation bar | placeholder |

---

## Azure App Registrations

Two App Registrations are required: one for the **Backend API** (used by the FastAPI service to call the Verified ID API and validate inbound JWTs), and one for the **Frontend SPA** (used by the Angular application to authenticate users via MSAL).

---

### App 1 — Backend API App Registration

This registration allows the backend to:

- Acquire tokens to call the Microsoft Entra Verified ID Request Service
- Validate JWT access tokens sent by the Angular frontend
- Expose application roles (`helpdesk`, `hr`) and a delegated scope (`access_as_user`)

#### Step 1 — Create the registration

1. Open the [Azure portal](https://portal.azure.com) and navigate to **Microsoft Entra ID → App registrations → New registration**
2. Fill in the form:
   - **Name**: `VerifID – Backend API` _(or any name you prefer)_
   - **Supported account types**: _Accounts in this organizational directory only (Single tenant)_
   - **Redirect URI**: leave empty (the backend does not use redirect flows)
3. Click **Register**
4. Note the **Application (client) ID** — this is your `AZURE_CLIENT_ID`
5. Note the **Directory (tenant) ID** — this is your `AZURE_TENANT_ID`

#### Step 2 — Create a client secret

1. In the app registration, go to **Certificates & secrets → Client secrets → New client secret**
2. Add a description (e.g. `verifid-backend`) and choose an expiry
3. Click **Add** and immediately copy the **Value** — this is your `AZURE_CLIENT_SECRET`

> ⚠️ The secret value is only shown once. Store it securely in a vault or as a Docker secret.

#### Step 3 — Expose an API (Application ID URI and scope)

1. Go to **Expose an API**
2. Click **Set** next to _Application ID URI_ — accept the default (`api://<client-id>`) or use a custom URI
3. Click **Add a scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: _Admins and users_
   - **Admin consent display name**: `Access VerifID as a user`
   - **Admin consent description**: `Allows the application to access the VerifID helpdesk API on behalf of the signed-in user`
   - **State**: Enabled
4. Click **Add scope**

#### Step 4 — Declare application roles

Application roles are used for server-to-server authorization (`helpdesk`, `hr`).

1. Go to **App roles → Create app role**

**Role 1 — Helpdesk**

| Field                | Value                                               |
| -------------------- | --------------------------------------------------- |
| Display name         | `Helpdesk`                                          |
| Allowed member types | `Users/Groups`                                      |
| Value                | `helpdesk`                                          |
| Description          | `Access to helpdesk identity verification features` |
| State                | Enabled                                             |

**Role 2 — HR**

| Field                | Value                                       |
| -------------------- | ------------------------------------------- |
| Display name         | `HR`                                        |
| Allowed member types | `Users/Groups`                              |
| Value                | `hr`                                        |
| Description          | `Access to HR credential issuance features` |
| State                | Enabled                                     |

#### Step 5 — Grant the Verified ID permission

The backend needs to call the Verified ID Request Service using its own identity (client credentials flow).

1. Go to **API permissions → Add a permission → APIs my organization uses**
2. Search for **Verifiable Credentials Service Request** (App ID: `3db474b9-6a0c-4840-96ac-1fceb342124f`)
3. Select **Application permissions** → `VerifiableCredential.Create.All`
4. Click **Add permissions**
5. Click **Grant admin consent for \<your tenant\>** — this is required because it is an application permission

#### Step 6 — Collect the configuration values

| `.env` variable       | Where to find it                              |
| --------------------- | --------------------------------------------- |
| `AZURE_TENANT_ID`     | Overview → Directory (tenant) ID              |
| `AZURE_CLIENT_ID`     | Overview → Application (client) ID            |
| `AZURE_CLIENT_SECRET` | Certificates & secrets → the value you copied |
| `AUTH_AUDIENCE`       | `api://<client-id>` or the Application ID URI |

---

### App 2 — Frontend SPA App Registration

This registration allows the Angular application to sign users in via MSAL and obtain access tokens that are forwarded to the FastAPI backend.

#### Step 1 — Create the registration

1. Go to **Microsoft Entra ID → App registrations → New registration**
2. Fill in the form:
   - **Name**: `VerifID – Frontend SPA`
   - **Supported account types**: _Accounts in this organizational directory only (Single tenant)_
   - **Redirect URI**: Select **Single-page application (SPA)** and enter `https://yourdomain.com` (add `http://localhost:4200` during development)
3. Click **Register**
4. Note the **Application (client) ID** — this is your `AUTH_CLIENT_ID`

#### Step 2 — Configure authentication

1. Go to **Authentication**
2. Under **Single-page application**, verify the redirect URI you entered
3. Add additional redirect URIs if needed (e.g. `http://localhost:4200` for local dev)
4. Under **Implicit grant and hybrid flows**, make sure **both checkboxes are unchecked** — MSAL v3/v4 uses the Authorization Code flow with PKCE; implicit grant is not needed and should remain disabled
5. Under **Front-channel logout URL**, you can optionally add your logout page URL
6. Click **Save**

#### Step 3 — Add API permissions

The frontend needs permission to call the backend API using the scope created in App 1.

1. Go to **API permissions → Add a permission → My APIs**
2. Select **VerifID – Backend API**
3. Select **Delegated permissions** → `access_as_user`
4. Click **Add permissions**
5. Click **Grant admin consent for \<your tenant\>** _(optional but recommended to avoid per-user consent prompts)_

#### Step 4 — Assign users to roles

Roles are assigned via **Enterprise Applications**, not App Registrations.

1. Navigate to **Microsoft Entra ID → Enterprise Applications**
2. Search for **VerifID – Backend API** _(the enterprise app is automatically created alongside the app registration)_
3. Go to **Users and groups → Add user/group**
4. Select the users or groups you want to assign and pick the role (`Helpdesk` or `HR`)
5. Click **Assign**

> Role assignments are reflected in the `roles` claim of the access token. Users without an assigned role will receive a 403 on protected endpoints.

#### Step 5 — Collect the configuration values

| `.env` variable  | Where to find it                                               |
| ---------------- | -------------------------------------------------------------- |
| `AUTH_CLIENT_ID` | Overview → Application (client) ID of the **SPA** registration |

---

### Summary Table

| Purpose                                    | App Registration         | Key values                                                     |
| ------------------------------------------ | ------------------------ | -------------------------------------------------------------- |
| Backend token acquisition & JWT validation | `VerifID – Backend API`  | `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AUTH_AUDIENCE`      |
| Frontend user sign-in (MSAL)               | `VerifID – Frontend SPA` | `AUTH_CLIENT_ID`                                               |

---

## Roles & Permissions

| Role / Scope                       | Grants access to                                                |
| ---------------------------------- | --------------------------------------------------------------- |
| `helpdesk` (app role)              | `/api/v1/verified-id/assist/{code}`                             |
| `hr` (app role)                    | `/api/v1/verified-id/issue`                                     |
| _(no auth)_                        | `/verify` page and `/api/v1/verified-id/verify`                 |

Authentication can be disabled entirely by setting `AUTH_ENABLED=False` — useful during initial setup and testing.

---

## Development

### Prerequisites

- Python 3.14+
- Node.js 18+
- Angular CLI 21

A ready-to-use **VS Code Dev Container** is included (`.devcontainer/`). Open the repository in VS Code and select **Reopen in Container** to get a fully configured environment with Python, Node, Angular CLI, and all dependencies installed automatically.

### Backend

```bash
cd backend
cp .env.example .env   # fill in your Azure values
uv sync
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs are available at `http://localhost:8000/api/docs` when `SWAGGER_ENABLE=True`.

### Frontend

```bash
cd frontend
npm install
ng serve --host 0.0.0.0   # proxies /api/* to http://localhost:8000
```

The Angular dev server starts at `http://localhost:4200`.

### Build & Run (local Docker)

```bash
docker compose up --build
```

---

## CI / CD

A GitHub Actions workflow can be added to build and publish the Docker image automatically on every push to `main` and on version tags. The recommended tag strategy is `latest`, `X.Y.Z`, and `sha-<commit>`.

---

## Healthcheck

`GET /api/health` returns:

```json
{ "status": "healthy", "service": "VerifID API" }
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

Author: [@cyr-ius](https://github.com/cyr-ius)
