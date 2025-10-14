# Prisma Schema Review

This document summarizes potential improvements to the generated Prisma schema.

## Data integrity and relationships
- `accounts.affiliationid` is modeled as a bare `BigInt` without a Prisma `@relation` to the `affiliations` table. Adding the relation would allow Prisma to enforce referential integrity and expose `accounts.affiliations` in the client API. 【F:draco-nodejs/backend/prisma/schema.prisma†L20-L111】

## Data types and sizing
- Social media OAuth tokens (`twitteroauthtoken`, `twitteroauthsecretkey`) and related IDs are constrained to 50 characters, which is shorter than the length returned by current OAuth providers; using `Text` (or at least `VarChar(255)`) would avoid truncation risks. 【F:draco-nodejs/backend/prisma/schema.prisma†L26-L33】
- Several location fields such as `availablefields.latitude` and `availablefields.longitude` are stored as strings, preventing numeric comparisons or distance calculations; switching to `Decimal` columns would improve data quality. 【F:draco-nodejs/backend/prisma/schema.prisma†L147-L166】
- Address fields like `zipcode` and `state` are restricted to 10 and 25 characters respectively, which limits support for international formats. Relaxing these constraints or storing them in dedicated lookup tables would increase flexibility. 【F:draco-nodejs/backend/prisma/schema.prisma†L147-L166】
- Configuration values in `accountsettings.settingvalue` are capped at 25 characters, which may be too small for many settings (for example, URLs or descriptive labels). Consider expanding the length or normalizing settings into typed columns. 【F:draco-nodejs/backend/prisma/schema.prisma†L69-L76】

## Security and auditing
- Sensitive OAuth tokens and other secrets are stored in plain text on the `accounts` table. Moving them to an encrypted store or applying at-rest encryption (and avoiding exposure through Prisma queries) would harden the schema. 【F:draco-nodejs/backend/prisma/schema.prisma†L26-L33】
- Many tables, including `accounts`, lack standard auditing fields such as `createdAt` and `updatedAt`, making it difficult to trace changes or drive data retention policies. For all edits, would be nice to have that + userId making the change. Adding timestamp columns with Prisma's `@default(now())` and `@updatedAt` helpers would improve observability. 【F:draco-nodejs/backend/prisma/schema.prisma†L20-L66】

## Query performance
- Foreign-key columns (for example `accountsettings.accountid` and `availablefields.accountid`) do not have explicit indexes beyond their primary keys. Adding secondary indexes can speed up lookups and joins, especially when tables grow large. 【F:draco-nodejs/backend/prisma/schema.prisma†L69-L166】

These adjustments would align the Prisma schema more closely with current best practices and reduce downstream maintenance risk.
