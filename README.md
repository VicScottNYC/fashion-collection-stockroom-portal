# ATELIER — Fashion Collection & Stockroom Portal

ATELIER is a full-stack fashion inventory portal combining premium editorial design with practical stockroom operations. Its current dashboard supports authenticated product management, SKU tracking, stock visibility, and role-based access through React, FastAPI, and Supabase.

## Development status and roadmap

Sprints 1–4 are completed development milestones. The summaries below reflect deliverables visible in the repository; they do not imply that every item in the original build guide has shipped. Sprint 5 is planned, and subsequent sprint scope is TBD.

| Sprint | Status | Verified deliverables or planned scope | Notes |
| --- | --- | --- | --- |
| 1 — Foundation | Completed | Project initialization, frontend scaffold, application structure and visual foundation | [Sprint 1](#sprint-1--foundation) |
| 2 — Dashboard and API integration | Completed | Fashion dashboard, inventory table, FastAPI product API and frontend integration | [Sprint 2](#sprint-2--dashboard-and-api-integration) |
| 3 — Database and inventory CRUD | Completed | Supabase PostgreSQL integration; create, read, edit and delete product workflows | [Sprint 3](#sprint-3--database-and-inventory-crud) |
| 4 — Authentication and access control | Completed | Supabase sign-in, token verification, role-based inventory access and product image display | [Sprint 4](#sprint-4--authentication-and-access-control) |
| 5 — Testing and deployment | Planned | Automated tests, GitHub Actions, documentation and a hosted demonstration, as proposed in the build guide | [Sprint 5](#sprint-5--testing-and-deployment) |
| Future sprints | TBD | Scope, sequence and acceptance criteria to be defined | — |

## Technology stack

| Layer | Current implementation |
| --- | --- |
| Frontend | React 19, TypeScript 6, Vite 8, HTML and CSS |
| Frontend tooling | ESLint, npm and a committed package lockfile |
| API | Python, FastAPI, Pydantic and Uvicorn |
| Data access | SQLAlchemy with psycopg; Supabase PostgreSQL |
| Identity | Supabase Auth, Supabase JavaScript/Python clients and PyJWT with JWKS verification |
| Images | Supabase Storage image URLs; Pillow validation helper |
| Hosting | Microsoft Azure is the original intended cloud target; deployment configuration is not present in this checkout |

Versions are based on the dependency manifests. Some backend runtime imports are not yet captured in `backend/requirements.txt`; see [local setup](#local-setup).

## Current features

- Email/password sign-in, persistent sessions and sign-out through Supabase Auth.
- Dashboard metrics for product styles, inventory units and stock alerts. Seasonal collection cards and the collection count currently use local mock data.
- Live inventory loaded from the FastAPI product API, with search by product name or SKU and filters by collection, category and stock status.
- Product creation and editing, deletion with confirmation, validation of nonnegative quantities and handling of duplicate SKUs.
- Product thumbnails from the public `product-images` storage bucket, with placeholders for missing or failed images.
- Server-enforced permissions, with matching controls in the interface:

| Role | Read inventory | Create and edit | Delete |
| --- | --- | --- | --- |
| `administrator` | Yes | Yes | Yes |
| `inventory_manager` | Yes | Yes | No |
| `viewer` | Yes | No | No |

Dedicated collection management, stock transfers between locations, inventory audit trails and operational reporting are not implemented. Non-dashboard navigation currently shows coming-soon placeholders. Image validation and storage helpers exist, but there is no image upload API or upload interface.

## Architecture

```text
React + TypeScript (Vite)
  ├── Supabase Auth: sign-in and session management
  ├── Supabase user_roles: current user's interface permissions
  ├── Supabase Storage: public product image display
  └── REST / JSON + bearer access token
        └── FastAPI
              ├── ES256 token verification using Supabase JWKS
              ├── Role lookup through backend Supabase client
              └── SQLAlchemy / psycopg → Supabase PostgreSQL
```

Inventory queries run through the backend database connection. The API verifies identity and role before authorizing product operations; hiding a frontend button is not the security boundary.

```text
frontend/                 React application, components and API services
backend/app/              FastAPI routes, authentication, roles and data access
backend/requirements.txt  Committed Python dependency list
database/migrations/     Local placeholder; no committed migrations yet
docs/architecture/       Local placeholder; no committed architecture notes yet
```

## Local setup

### Prerequisites

- Node.js compatible with Vite 8: `^20.19.0` or `>=22.12.0`, plus npm.
- Python with virtual environment support and compatibility with the pinned backend packages. The repository does not declare a supported Python version.
- A configured Supabase project with PostgreSQL, Auth and application roles. The current API expects ES256-signed Supabase access tokens.

### 1. Prepare Supabase

This checkout contains no schema migrations or seed scripts. Use the existing project schema or obtain the reviewed database setup before starting against a fresh project. The code expects:

- `public.products` with `id`, `sku`, `name`, `category`, `collection`, `quantity`, `status` and nullable `image_path`; product creation expects a database-generated ID and SKU uniqueness.
- `public.user_roles` associating `user_id` with one of the three roles listed above. Create authorized Auth users and assign their roles through a trusted administrative process.
- Policies permitting the authenticated frontend to read its own role while preventing clients from assigning or changing roles. Verify these policies in Supabase; their definitions are not stored here.
- If using thumbnails, a public `product-images` bucket containing only images intended for public access. Product `image_path` values are paths within that bucket.

### 2. Configure environment variables

Create `backend/.env` with your own values:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_BACKEND_ONLY_SECRET_KEY
SUPABASE_STORAGE_BUCKET=product-images
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

These are placeholders, not working credentials. All `VITE_` values are exposed to the browser; use only the Supabase publishable key there. The backend bucket variable is used by the storage helper; the current thumbnail component separately uses the fixed `product-images` bucket name.

### 3. Start the backend

From the repository root:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pip install 'PyJWT[crypto]' supabase Pillow
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

The additional install command supplies imports used by the current code but missing from the committed requirements. Their versions still need to be pinned for a reproducible backend install. Image validation is currently an unconnected helper; adding an upload endpoint will require its own dependency and integration review.

The API exposes a health response at `http://127.0.0.1:8001/health` and interactive API documentation at `http://127.0.0.1:8001/docs`. A healthy response does not verify database connectivity or authentication.

### 4. Start the frontend

In another terminal, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` and sign in with a provisioned Supabase user. Local API CORS permits `http://localhost:5173` and `http://127.0.0.1:5173`; a different frontend origin requires an API configuration change.

### Development checks

```sh
cd frontend
npm run build
npm run lint
```

The build script runs TypeScript checks and creates the Vite production bundle. There is no committed automated backend test suite or CI workflow at this milestone. Live checks require an appropriately configured Supabase project and authorized test accounts.

## Security notes

- Keep database passwords, backend Supabase secret keys, access tokens and private keys out of source control, screenshots and logs. Environment files are ignored; check staged changes before sharing.
- Treat the backend Supabase secret key as privileged. Keep it on the server and use separate, least-privilege credentials where possible.
- The API validates ES256 signatures, issuer, audience, required token claims and the authenticated Supabase role, then resolves the application role from `user_roles`.
- Database access uses a server connection rather than forwarding the user's token. Review the database connection's privileges and Supabase row-level policies independently; API role enforcement does not establish that database policies are configured correctly.
- Product image URLs are public. Do not store confidential assets in the public bucket. The existing image validation helper checks format, size and dimensions and re-encodes images, but it is not wired into an upload workflow.
- Production deployment still needs environment configuration, HTTPS and appropriate CORS origins, dependency pinning, security verification and deployment checks.

## Sprint notes

### Sprint 1 — Foundation

History: `f904004` initializes the project and README; `f601693` adds the React and TypeScript scaffold. The original architecture separates frontend, backend, database and documentation concerns.

### Sprint 2 — Dashboard and API integration

History: `36e5e34` implements the fashion inventory dashboard; `bb3846e` connects FastAPI products to React. The dashboard establishes the editorial visual direction, reusable cards and inventory presentation. The build guide also contains a later “Sprint 2 — FastAPI Backend” section, so this summary follows the delivered code rather than assuming its initial roadmap labels remained fixed.

### Sprint 3 — Database and inventory CRUD

History: `4f9424b` integrates Supabase PostgreSQL; `6b55758` completes product CRUD through FastAPI and React. Inventory transactions beyond these product operations are not represented in the current code.

### Sprint 4 — Authentication and access control

History: `def595f` adds Supabase authentication and role-based inventory access, together with product image display and image/storage helpers. The original build guide's Enterprise Workflows scope also mentions stock transfers and audit trails; those remain unimplemented and need future scope decisions.

### Sprint 5 — Testing and deployment

Planned scope from the local build guide: automated tests, GitHub Actions, documentation and a hosted demonstration. Completion criteria, hosting implementation and scheduling remain to be defined. The guide is available locally as `Fashion Collection (Build Guide).docx` but is not tracked in Git, so it is not a portable repository reference.

## Design philosophy

Fashion + Enterprise Hybrid: elegant fashion-inspired interfaces paired with practical inventory management workflows.
