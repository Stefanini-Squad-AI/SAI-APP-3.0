# Database — MongoDB

MongoDB 7 configuration and initialization scripts for TuCreditoOnline.

## Structure

```
database/
├── init/
│   └── init-db.js              # Collection creation, validators, indexes, and seed data
└── migrate-credit-requests.js  # One-time migration: PascalCase → camelCase field names
```

## Collections

| Collection | Description | Validator |
|---|---|---|
| `users` | Admin and analyst accounts | Yes — required: `email`, `passwordHash`, `role`, `createdAt` |
| `credittypes` | Loan product catalog | Yes — required: `name`, `baseInterestRate`, `maxAmount`, `createdAt` |
| `creditrequests` | Customer credit applications | Yes — required: `email`, `requestedAmount`, `status`, `createdAt` |
| `services` | Public-facing service entries | Yes — required: `title`, `displayOrder`, `isActive` |
| `contactmessages` | Inbound contact form submissions | Yes — required: `name`, `email`, `message`, `status`, `createdAt` |

## Initialization

`init-db.js` runs automatically the first time the MongoDB container is created (`/docker-entrypoint-initdb.d/`). It:

1. Creates all five collections with JSON schema validators
2. Creates performance indexes
3. Seeds the four default credit types

**Admin user:** The default admin account is **not** seeded by this script. It is seeded by the backend application (`AdminUserSeeder`) on first startup. Credentials are controlled by the `DefaultAdmin__Email` and `DefaultAdmin__Password` environment variables (see `.env` / `docker-compose.yml`).

## Reset & Re-initialize

To drop all data and re-run initialization from scratch:

```bash
docker compose down -v
docker compose up --build
```

## Conventions

- Collection names: plural, lowercase (`creditrequests`, not `CreditRequests`)
- Fields: camelCase (`createdAt`, `fullName`)
- Timestamps: `createdAt`, `updatedAt`
- Soft deletes: `deletedAt` field (null when active)

## Running the Migration

The `migrate-credit-requests.js` script converts legacy PascalCase field names to camelCase. Run it once against a live database if you have pre-existing data from before the camelCase convention was enforced:

```bash
mongosh "mongodb://<user>:<pass>@localhost:27017/tucreditoonline?authSource=admin" migrate-credit-requests.js
```
