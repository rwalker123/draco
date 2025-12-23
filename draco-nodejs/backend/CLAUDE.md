# Backend Guide

- Start with the repo-wide expectations in [Repository Guidelines](../../CLAUDE.md).
- For detailed examples, diagrams, and tools, see [Backend Reference](./BACKEND_REFERENCE.md).

## Daily Workflow
- Develop locally with `npm run backend:dev` from the repo root.
- Run the backend suite with `npm run backend:test`.
- After changes, run `npm run backend:lint` and `npm run backend:type-check`.

## Key Directories
- `src/routes` — Express route definitions, validation, and access control.
- `src/services` — Business logic orchestrating repositories and formatters.
- `src/repositories` — Prisma data access and transactions.
  - `/interfaces` — Repository interface definitions (e.g., `IContactRepository`)
  - `/implementations` — Prisma implementations (e.g., `PrismaContactRepository`)
- `src/responseFormatters` — Convert DB types to shared schema types.
- `prisma` — Schema, migrations, and seed scripts.

## Critical Rules

⚠️ **Type definition rule:** never introduce new Zod schemas or shared type definitions anywhere in the backend (routes, services, helpers, etc.) without explicit approval from the maintainer. All type shape changes must go through the shared schema workflow once approved.

⚠️ **Service creation rule:** never 'new ServiceName()', always access from the ServiceFactory. If a service isn't exposed to ServiceFactory, expose it, then access via ServiceFactory.getServiceName(). No constructor arguments should be given to a service. It should use ServiceFactory and RepositoryFactory to get the dependent services and repositories.

⚠️ **Repository creation rule:** never 'new RepositoryName()', always access from the RepositoryFactory. Use RepositoryFactory.getRepositoryName() to obtain repository instances.

⚠️ **Raw Interface Pattern:** If an interface has "Raw" in its name, it should NEVER use other interfaces that are not also "Raw". Raw interfaces represent database structure with lowercase field names (`firstname`, `lastname`). Formatted interfaces represent API response structure with camelCase (`firstName`, `lastName`). Mixing these creates type inconsistencies.

⚠️ **Season Tables:** ALWAYS use season-specific tables (`leagueseason`, `divisionseason`, `teamsseason`) for statistics and queries. Never use definition tables (`league`, `divisiondefs`, `teams`) for statistics or season-scoped data.

⚠️ **API Contract Rule:** Never modify API response shapes without searching for ALL consumers first. Check frontend components, other backend services, and tests before changing any endpoint response structure. Breaking changes require explicit approval.

---

# Backend Architecture

## Core Architectural Principles

### 1. Type Safety with Shared Schemas
- All API contracts defined in OpenAPI via `src/openapi/zod-to-openapi.ts`
- All request/response types come from `@draco/shared-schemas`
- Never use dynamic types or `any`
- OpenAPI specification generates frontend SDK automatically
- No ad-hoc Zod schemas in routes, services, or helpers

### 2. Layered Architecture
- **Route Layer** — Untrusted boundary: validation, authentication, authorization
- **Service Layer** — Business logic orchestrating repository operations
- **Repository Layer** — Database operations returning native DB types
- **Response Formatters** — Convert native DB types to shared schema types

### 3. Security-First Design
- All permissions and validations happen at the route level
- Account boundary enforcement via middleware
- Hierarchical role-based access control
- Services assume data is validated and user is authorized

## Layer Responsibilities

### 1. Route Layer (`/routes`)
**Purpose:** Untrusted boundary handling all security concerns

**Key Responsibilities:**
- Parse and validate route parameters using `extractAccountParams()`, `extractContactParams()`
- Validate request body with Zod schemas from shared-schemas
- Apply authentication middleware (`authenticateToken`)
- Enforce permissions (`routeProtection.requirePermission()`)
- Enforce account boundaries (`routeProtection.enforceAccountBoundary()`)
- Return shared schema types directly (no wrapper objects)
- Use `asyncHandler` for automatic exception handling

**Pattern:**
```typescript
router.post('/:accountId/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const createContactData = CreateContactSchema.parse(req.body);
    const contact = await contactService.createContact(createContactData, BigInt(accountId));
    res.status(201).json(contact);
  })
);
```

### 2. Service Layer (`/services`)
**Purpose:** Business logic orchestration

**Key Responsibilities:**
- Implement business rules and workflows
- Orchestrate multiple repository operations
- Use response formatters to convert DB types to shared schema types
- Assume data is validated and user is authorized (trust route layer)
- Never make direct database calls (use repositories)
- Access via ServiceFactory, never instantiate directly

**Pattern:**
```typescript
export class ContactService {
  async createContact(contactData: CreateContactType, accountId: bigint): Promise<ContactType> {
    const processedData = this.processContactData(contactData);
    const dbContact = await this.contactRepository.create(processedData, accountId);
    return ContactResponseFormatter.format(dbContact);
  }
}
```

### 3. Repository Layer (`/repositories`)
**Purpose:** Database operations returning native DB types

**Key Responsibilities:**
- Encapsulate all database operations
- Organize by domain (e.g., `AccountsRepository`), not per-endpoint
- Return native Prisma types only
- Handle database-specific logic (transactions, complex queries)
- No knowledge of shared schema types
- No business logic
- Define interfaces in `/interfaces`, implementations in `/implementations`
- Access via RepositoryFactory, never instantiate directly

**Pattern:**
```typescript
// Interface
export interface IContactRepository {
  create(contactData: ProcessedContactData, accountId: bigint): Promise<PrismaContactWithIncludes>;
  findById(contactId: bigint): Promise<PrismaContactWithIncludes | null>;
}

// Implementation
export class PrismaContactRepository implements IContactRepository {
  async create(contactData: ProcessedContactData, accountId: bigint): Promise<PrismaContactWithIncludes> {
    return await prisma.contacts.create({
      data: { ...contactData, creatoraccountid: accountId },
      include: { contactroles: { include: { roles: true } } }
    });
  }
}
```

### 4. Response Formatters (`/responseFormatters`)
**Purpose:** Convert native DB types to shared schema types

**Key Responsibilities:**
- Single responsibility: type conversion only
- Convert Prisma types to shared schema types
- Handle field name mapping (e.g., `firstname` → `firstName`)
- Transform IDs (BigInt → string), format dates
- No business logic

**Pattern:**
```typescript
export class ContactResponseFormatter {
  static format(dbContact: PrismaContactWithIncludes): ContactType {
    return {
      id: dbContact.id.toString(),
      firstName: dbContact.firstname,
      lastName: dbContact.lastname,
      email: dbContact.email || undefined,
      // ... field mappings
    };
  }

  static formatMany(dbContacts: PrismaContactWithIncludes[]): ContactType[] {
    return dbContacts.map(contact => this.format(contact));
  }
}
```

## OpenAPI Integration

All API endpoints must be defined in `src/openapi/zod-to-openapi.ts`:

```typescript
const ContactSchemaRef = registry.register('Contact', ContactSchema);

registry.registerPath({
  method: 'post',
  path: '/api/accounts/{accountId}/contacts',
  summary: 'Create a new contact',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ accountId: z.string() }),
    body: { content: { 'application/json': { schema: CreateContactSchemaRef } } }
  },
  responses: {
    201: { content: { 'application/json': { schema: ContactSchemaRef } } }
  }
});
```

After changes, regenerate with `npm run sync:api` to update frontend SDK.

## Error Handling

Use custom error types and let `asyncHandler` catch them:

```typescript
if (!contact) {
  throw new NotFoundError('Contact not found');
}

if (duplicateEmail) {
  throw new ConflictError('Email already exists');
}

// Global handler formats to: { error: "NotFound", message: "Contact not found", statusCode: 404 }
```

## Middleware Stack

Standard security pipeline for routes:
1. `authenticateToken` — Validate JWT, populate `req.user`
2. `enforceAccountBoundary` — Ensure user belongs to account in URL
3. `requirePermission` — Check user has required permission
4. `validatePhotoUpload` — Validate file upload parameters (if needed)
5. `handleFileUpload` — Process multipart file uploads (if needed)
6. `parseFormDataJSON` — Parse JSON from multipart form data (if needed)

## Database Patterns

- Repositories use Prisma Client directly
- Include relationships as needed for response formatting
- BigInt IDs converted to strings in formatters
- Nullable fields handled appropriately in formatters
- Complex queries encapsulated in repository methods
- **ALWAYS use season-specific tables** for statistics queries

## Best Practices

### Route Layer
- Always use `asyncHandler` for automatic exception handling
- Validate everything: parameters, body, query string
- Apply full security middleware stack
- Return shared types directly, no wrapper objects
- Use parameter extractors: `extractAccountParams()`, `extractContactParams()`

### Service Layer
- Single responsibility per service (one domain)
- Orchestrate repositories, coordinate multiple data operations
- Business logic only — no database calls, no validation
- Use formatters to convert all DB types to shared schema types
- Access via ServiceFactory: `ServiceFactory.getContactService()`

### Repository Layer
- Database operations only — no business logic
- Return native Prisma types, not shared schema types
- Use transactions for complex multi-table operations
- Include relationships as needed for response formatting
- Access via RepositoryFactory: `RepositoryFactory.getContactRepository()`

### Response Formatters
- Single purpose: type conversion only
- Static methods for pure function conversion
- Handle nulls properly (convert to undefined as needed)
- Transform IDs: BigInt to string
- Format dates consistently

## Implementation Checklist

For each new endpoint:

1. ✅ Define Schema Types in `@draco/shared-schemas` (with approval)
2. ✅ Register in OpenAPI (`src/openapi/zod-to-openapi.ts`)
3. ✅ Implement Route with proper middleware stack
4. ✅ Create Service Method for business logic orchestration
5. ✅ Create Repository Method for database operations
6. ✅ Create Response Formatter for type conversion
7. ✅ Test Integration end-to-end
8. ✅ Run `npm run backend:lint` and `npm run backend:type-check`

## Anti-Patterns to Avoid

### ❌ Don't Do This:

```typescript
// Direct DB calls in route
router.post('/contacts', async (req, res) => {
  const contact = await prisma.contacts.create({...}); // ❌
  res.json({ success: true, data: contact }); // ❌ Wrapper objects
});

// Direct DB calls in service
class ContactService {
  async createContact() {
    return await prisma.contacts.create({...}); // ❌
  }
}

// Any types and mixed responsibilities
function formatContact(dbContact: any) { // ❌ any types
  return { ...dbContact, success: true }; // ❌ Adding wrapper fields
}

// Direct instantiation
const service = new ContactService(); // ❌
const repo = new ContactRepository(); // ❌
```

### ✅ Do This Instead:

```typescript
// Clean route with full security
router.post('/contacts',
  authenticateToken,
  routeProtection.enforceAccountBoundary(),
  routeProtection.requirePermission('account.contacts.manage'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { accountId } = extractAccountParams(req.params);
    const data = CreateContactSchema.parse(req.body);
    const contact = await contactService.createContact(data, BigInt(accountId));
    res.status(201).json(contact); // ✅ Direct return, no wrapper
  })
);

// Clean service with proper types
class ContactService {
  async createContact(data: CreateContactType, accountId: bigint): Promise<ContactType> {
    const dbContact = await this.contactRepository.create(data, accountId);
    return ContactResponseFormatter.format(dbContact); // ✅ Use formatter
  }
}

// Clean formatter with proper types
class ContactResponseFormatter {
  static format(dbContact: PrismaContactType): ContactType {
    return { id: dbContact.id.toString(), firstName: dbContact.firstname, ... };
  }
}

// Use factories
const service = ServiceFactory.getContactService(); // ✅
const repo = RepositoryFactory.getContactRepository(); // ✅
```

---

For detailed examples, complete implementations, diagrams, and deployment configurations, see [BACKEND_REFERENCE.md](./BACKEND_REFERENCE.md).
