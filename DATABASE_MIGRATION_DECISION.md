# Database Migration Decision: Prisma Accelerate → Railway

## Problem Statement

Our baseball statistics application has computed columns (`GENERATED ALWAYS AS`) in the PostgreSQL database that are not being calculated properly after migration from SQL Server. The current Prisma Accelerate setup has limitations that prevent us from implementing these computed columns correctly.

### Current Issues
1. **Missing Computed Fields**: `batstatsum` and `pitchstatsum` tables have fields (`tb`, `pa`, `obadenominator`, `obanumerator`, `whipnumerator`, `ipnumerator`) that should be calculated automatically
2. **Prisma Accelerate Limitations**: Cannot perform DDL operations like `ALTER TABLE` to add `GENERATED ALWAYS AS` columns
3. **Import Complications**: Data import process needs to handle computed fields properly

## Evaluated Solutions

### 1. Supabase (Database Only)
**Pros:**
- Full PostgreSQL with `GENERATED ALWAYS AS` support
- Cost-effective ($0-25/month)
- Good free tier

**Cons:**
- Would require database migration
- Still need separate hosting for backend/frontend
- Additional complexity for deployment

### 2. Supabase (Full BaaS)
**Pros:**
- Complete backend-as-a-service
- Built-in auth, storage, real-time features

**Cons:**
- Would require migrating existing auth system (unnecessary complexity)
- Learning curve for new API patterns
- Less control over business logic

### 3. AWS RDS
**Pros:**
- Full PostgreSQL control
- Reliable and scalable

**Cons:**
- Expensive (~$13-15/month for db.t3.micro)
- Complex setup and management
- Overkill for small application

### 4. Railway (Chosen Solution)
**Pros:**
- **One-stop solution**: Database, backend, and frontend hosting
- Full PostgreSQL features including `GENERATED ALWAYS AS` columns
- Cost-effective (~$15/month total)
- Git-based deployments
- Excellent developer experience
- No limitations on DDL operations
- Unified platform with shared environment variables

**Cons:**
- New platform to learn (but straightforward)

## Technical Requirements

### Computed Columns to Implement

**batstatsum table:**
```sql
tb int GENERATED ALWAYS AS ((((d * 2) + (t * 3)) + (hr * 4)) + ((h - d) - (t) - hr)) STORED
pa int GENERATED ALWAYS AS (((ab + bb) + hbp) + (sh + sf) + intr) STORED
obadenominator int GENERATED ALWAYS AS (ab + bb + hbp) STORED
obanumerator int GENERATED ALWAYS AS (h + bb + hbp) STORED
```

**pitchstatsum table:**
```sql
tb int GENERATED ALWAYS AS (((d*(2)+t*(3))+hr*(4))+(((h-d)-t)-hr)) STORED
ab int GENERATED ALWAYS AS (((bf-bb)-hbp)-sc) STORED
whipnumerator int GENERATED ALWAYS AS (h+bb) STORED
ipnumerator int GENERATED ALWAYS AS (ip*(3)+ip2) STORED
```

## Migration Plan

### Phase 1: Database Setup
1. Create Railway PostgreSQL service
2. Migrate schema with computed columns
3. Import existing data
4. Test computed column calculations

### Phase 2: Backend Deployment
1. Deploy Node.js backend to Railway
2. Update `DATABASE_URL` to Railway PostgreSQL
3. Test all API endpoints
4. Verify Prisma ORM functionality

### Phase 3: Frontend Deployment
1. Deploy Next.js frontend to Railway
2. Configure environment variables
3. Test full application functionality

## Cost Comparison

| Platform | Database | Backend | Frontend | Total Cost |
|----------|----------|---------|----------|------------|
| **Current (Prisma Accelerate)** | Free (limited) | $5-20/month | $0-20/month | $5-40/month |
| **Railway** | $5/month | $5/month | $5/month | **$15/month** |
| Supabase + Vercel | $0-25/month | $0-20/month | $0-20/month | $0-65/month |
| AWS | $13-15/month | $5-20/month | $5-20/month | $23-55/month |

## Benefits of Railway Choice

1. **Cost Savings**: ~$15/month total vs current $5-40/month
2. **Full PostgreSQL Features**: Can implement computed columns properly
3. **Unified Platform**: All services in one dashboard
4. **Better Performance**: No limitations like Prisma Accelerate
5. **Developer Experience**: Git-based deployments, easy environment management
6. **Scalability**: Easy to scale as application grows

## Next Steps

1. Set up Railway account and project
2. Create PostgreSQL service with computed columns
3. Migrate existing data
4. Deploy backend and frontend
5. Test complete application functionality

## Decision Date
**Date**: January 20, 2025
**Reasoning**: Railway provides the best balance of cost-effectiveness, technical capabilities, and developer experience for our baseball statistics application. 