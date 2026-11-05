# Pitchdex

Outreach for founders raising money: search investors, save them as leads, and run email and LinkedIn sequences that pace themselves and stop when an investor replies.

| Folder | What's in it |
| --- | --- |
| `api/` | ASP.NET Core API on .NET 10, EF Core, PostgreSQL |
| `web/` | React 19 + TypeScript, Vite, TanStack Query, shadcn/ui |
| `docker-compose.yml` | Local Postgres database |

## What you need

- .NET 10 SDK
- Node 22 or newer
- Docker Desktop

## Run it locally

```bash
# 1. Database
docker compose up -d

# 2. API on http://localhost:5080 (API docs at http://localhost:5080/scalar)
cd api
dotnet tool restore
dotnet run --project src/Pitchdex.Api

# 3. Frontend on http://localhost:5173, in a second terminal
cd web
npm install
npm run dev
```

The first API run creates the tables and adds a few made-up sample leads. It also loads the
investor database from `data/sample-investors.csv` if that file exists. The `data/` folder is
git-ignored because the file holds real people's public profiles, so copy it in by hand. The
frontend sends `/api` requests to the API through Vite's proxy, so both run on one address in
the browser.

## Email and LinkedIn (Unipile)

Founders connect mailboxes (Gmail, Outlook, others) and LinkedIn accounts through
[Unipile](https://www.unipile.com). Pitchdex never sees their passwords: they sign in on
Unipile's page, and Pitchdex stores only Unipile's account id.

**Practice mode.** With no Unipile key set, the API runs in practice mode. Connecting an
account adds a pretend one, sending goes nowhere, and each email or LinkedIn message gets a
pretend reply about 30 seconds later. The API log says which mode it's in when it starts.
Practice data lives in memory and resets when the API restarts.

**Using real Unipile.** Sign up at Unipile, then copy your DSN (the API address, such as
`https://api8.unipile.com:13851`) and an API key from its dashboard into user secrets. They
stay on your machine and never go into git:

```bash
cd api/src/Pitchdex.Api
dotnet user-secrets set "Messaging:UnipileBaseUrl" "https://apiXXX.unipile.com:XXXXX"
dotnet user-secrets set "Messaging:UnipileApiKey" "your-api-key"
```

Restart the API. Its log should now say `Messaging: Unipile at …`.

**How replies arrive.** A background job checks every connected account for new messages
every 2 minutes, and the Inbox's **Check for replies** button does the same on demand. Only
messages from leads are stored; the rest of a founder's mailbox is ignored. Once the app has
a public address, Unipile webhooks can replace the polling.

## Deploying

Production and test run on AWS. The setup, first-time steps and investor imports are in [infra/README.md](infra/README.md).

## How the code is organized

```
api/src/
  Pitchdex.Domain/          entities and business rules, no dependencies
  Pitchdex.Application/     one folder per feature: request, validator, handler, DTO
  Pitchdex.Infrastructure/  EF Core DbContext, table configurations, migrations
  Pitchdex.Api/             controllers (HTTP only), startup, validation filter

web/src/
  app/              router, providers, error page
  layouts/          AppLayout: sidebar and page frame
  pages/            one file per route, lazy-loaded
  features/<name>/  components, hooks and schemas for one feature
  components/ui/    shadcn/ui building blocks (generated, don't hand-edit)
  components/common/ shared pieces: PageHeader, EmptyState
  lib/api/          typed API client, generated from the API's OpenAPI document
```

Leads is the reference feature. Copy its shape when adding a new one:

1. **Domain:** the entity, in `Pitchdex.Domain/Leads/Lead.cs`.
2. **Application:** one file per use case, such as `Leads/ListLeads.cs`, holding the request,
   validation rules and handler. Handlers register themselves by name.
3. **Infrastructure:** a table configuration, then a migration.
4. **Api:** a thin controller that calls the handler.
5. **Web:** run `npm run api:types`, then add hooks, components and a page under `features/`.

## Everyday commands

```bash
# New database migration (from api/)
dotnet ef migrations add <Name> --project src/Pitchdex.Infrastructure --startup-project src/Pitchdex.Api --output-dir Persistence/Migrations

# Refresh the frontend's API types after changing an endpoint (from web/, with the API running)
npm run api:types

# Checks (from web/)
npm run typecheck
npm run lint
npm run format
```

The API build treats warnings as errors, including packages with known security advisories.
