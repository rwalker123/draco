# 🚀 Railway Phase 2 Deployment Plan

## Overview
This document outlines the complete plan for deploying the Draco Sports Manager application to Railway, including multi-tenant domain support, database deployment, and file storage configuration.

## 🎯 **Phase 2 Objectives**
- Deploy entire stack to Railway (Database, Backend, Frontend)
- Implement multi-tenant domain architecture
- Configure persistent storage for database and file uploads
- Ensure compression and performance optimization in production
- Set up automatic SSL certificate generation for all domains

---

## 🏗️ **Architecture Overview**

### **Service Structure**
```
Draco Sports Manager Project
├── 🗄️ PostgreSQL Database Service
├── 🔧 Backend API Service (Node.js/Express)
├── 🌐 Frontend Service (Next.js)
└── 📁 File Storage (Railway Volumes)
```

### **Multi-Tenant Domain Model**
```
Primary Domain: draco-sports-manager.railway.app
Tenant Domains: 
├── team1.example.com → /account/{accountId}/home
├── league2.example.com → /account/{accountId}/home  
├── club3.example.com → /account/{accountId}/home
└── ... (unlimited tenant domains)
```

### **Domain Resolution Flow**
```
tenant1.example.com → Railway → Our App → /api/accounts/by-domain → Account ID → /account/{id}/home
```

---

## 📋 **Implementation Steps**

### **Step 1: Project Setup & Database**
```bash
# Create Railway project
railway init

# Add PostgreSQL database with persistent volume
railway add -d postgres

# Configure volume mount: /var/lib/postgresql/data
# This ensures data persistence across deployments
```

### **Step 2: Backend Service**
```bash
# Add backend service
railway add

# Configure environment variables
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3001
UPLOAD_PATH=/app/uploads
# ... other backend configs

# Configure volume mount for file uploads
# Mount Path: /app/uploads
# Volume: draco-uploads
```

### **Step 3: Frontend Service**
```bash
# Add frontend service  
railway add

# Configure environment variables
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
# ... other frontend configs
```

### **Step 4: Multi-Tenant Domain Configuration**
```bash
# Generate primary domain for frontend service
railway domain

# Configure custom domain support
# Railway automatically handles SSL for custom domains
```

---

## 🌐 **Multi-Tenant Domain Setup**

### **Railway Domain Management**
1. **Primary Domain**: `draco-sports-manager.railway.app` (automatic)
2. **Custom Domains**: Each tenant adds their domain via Railway dashboard
3. **SSL Certificates**: Railway automatically provisions Let's Encrypt certificates
4. **DNS Configuration**: Tenants point their domains to Railway's servers

### **Railway Custom Domain Features**
- **Automatic SSL**: Let's Encrypt certificates for all domains
- **Unlimited domains**: No limit on custom domains per service
- **Global CDN**: Fast loading worldwide
- **DNS validation**: Automatic domain verification
- **Private Networking**: Backend communication via `RAILWAY_PRIVATE_DOMAIN`
- **Domain Health Monitoring**: Automatic SSL renewal and validation
- **Tenant Caching**: 1-hour cache TTL for domain-to-account resolution
- **CORS Security**: Restricted to private domain communication

---

## 💾 **Storage Strategy (Railway Services)**

### **Database Storage**
- **PostgreSQL**: Persistent volume for all tenant data
- **Backups**: Railway's native backup system
- **Multi-tenancy**: Single database with account-based isolation
- **Volume Mount**: `/var/lib/postgresql/data`

### **File Storage**
- **Uploads Directory**: Railway volume mounted to `/app/uploads`
- **Per-Tenant Organization**: `/uploads/{accountId}/...`
- **Persistence**: Survives deployments and restarts
- **Capacity**: Scalable based on Railway plan
- **Volume Mount**: `/app/uploads`

---

## 🔧 **Technical Configuration**

### **Backend Service Variables**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3001
UPLOAD_PATH=/app/uploads
ENABLE_QUERY_LOGGING=false
RAILWAY_RUN_UID=0
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=30
CONNECTION_POOL_SIZE=10
SLOW_QUERY_THRESHOLD_MS=500
JWT_SECRET=${{Backend.JWT_SECRET}}
BCRYPT_ROUNDS=12
LOG_LEVEL=warn
PERFORMANCE_MONITORING=true
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf
FILE_CLEANUP_INTERVAL=24
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900
CORS_ORIGINS=${{Frontend.RAILWAY_PRIVATE_DOMAIN}}
HELMET_CSP_ENABLED=true
TENANT_CACHE_TTL=3600
# ... other configs
```

### **Frontend Service Variables**
```bash
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_TELEMETRY_DISABLED=1
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=10
# ... other configs
```

### **Volume Configuration**
```bash
# Backend service volume mount
Mount Path: /app/uploads
Volume: draco-uploads-prod
Initial Size: 10GB (expandable)
Permissions: Requires RAILWAY_RUN_UID=0 for proper access

# Database service volume mount (automatically configured by Railway)
Mount Path: /var/lib/postgresql/data
Volume: Auto-managed by Railway PostgreSQL service
Backup: Automatic daily backups by Railway

# Volume Expansion Strategy
- Monitor usage via Railway dashboard
- Expand before reaching 80% capacity
- No downtime required for expansion
- Down-sizing not supported (backup/restore required)
```

---

## 🚀 **Deployment Process**

### **Phase 2A: Infrastructure & Security**
1. Deploy PostgreSQL with optimized connection settings
2. Deploy backend service with all security configurations:
   - Volume permissions (`RAILWAY_RUN_UID=0`)
   - Security hardening (rate limiting, CORS, CSP)
   - Performance monitoring enabled
   - Query logging controlled via `ENABLE_QUERY_LOGGING`
3. Set up volumes with proper permissions and sizing
4. Configure private networking between services
5. Run database migrations and verify connectivity
6. Test file upload functionality and persistence

### **Phase 2B: Frontend & Private Integration**
1. Deploy frontend service with private backend communication
2. Configure deployment overlap for zero downtime
3. Test API connectivity through private network (`RAILWAY_PRIVATE_DOMAIN`)
4. Verify compression and performance optimizations
5. Test authentication and role-based access
6. Validate multi-tenant routing functionality

### **Phase 2C: Multi-Tenant & Production Readiness**
1. Configure custom domain handling with caching
2. Test tenant domain resolution and SSL generation
3. Set up health monitoring and observability
4. Configure graceful shutdown and deployment strategies
5. Performance testing across multiple tenants
6. Validate backup and disaster recovery procedures
7. Document tenant onboarding and monitoring processes

---

## 🌍 **Multi-Tenant Benefits on Railway**

### **Scalability**
- **Unlimited tenants**: No artificial limits
- **Shared infrastructure**: Cost-effective scaling
- **Automatic scaling**: Based on actual usage

### **Management**
- **Single dashboard**: Manage all services in one place
- **Unified monitoring**: Track performance across tenants
- **Centralized backups**: All data in one backup system

### **Cost Efficiency**
- **Shared resources**: Database, storage, compute
- **No per-tenant fees**: Single Railway project
- **Predictable pricing**: Based on actual usage

---

## 📋 **Tenant Onboarding Process**

### **For New Tenants**
1. **Domain Setup**: Point their domain to Railway
2. **Railway Configuration**: Add custom domain in dashboard
3. **SSL Generation**: Automatic certificate provisioning
4. **Account Creation**: Use existing signup flow
5. **Data Isolation**: Account-based data separation

### **Railway Dashboard Tasks**
- Add custom domain to frontend service
- Verify domain ownership
- Monitor SSL certificate status
- Track domain performance

---

## 📊 **Monitoring and Observability**

### **Railway Built-in Monitoring**
- **Service Metrics**: CPU, memory, network usage via Railway dashboard
- **Deployment Logs**: Real-time logs for all services
- **Health Checks**: Automatic monitoring with configurable timeouts
- **Replica Tracking**: Individual replica identification via `RAILWAY_REPLICA_ID`
- **Regional Monitoring**: Geographic distribution via `RAILWAY_REPLICA_REGION`

### **Application-Level Monitoring**
```bash
# Backend Service - Observability Configuration
LOG_LEVEL=warn                    # Production logging level
PERFORMANCE_MONITORING=true       # Enable existing performance monitor
ENABLE_QUERY_LOGGING=false        # Disable SQL logging by default
SLOW_QUERY_THRESHOLD_MS=500       # Alert on slow queries
RATE_LIMIT_MONITORING=true        # Track API rate limiting
```

### **Database Monitoring**
- **Connection Pool**: Monitor via `CONNECTION_POOL_SIZE` configuration
- **Query Performance**: Track slow queries above 500ms threshold
- **Backup Status**: Railway's automatic daily backup monitoring
- **Connection Health**: Private network connectivity validation

### **File Storage Monitoring**
- **Volume Usage**: Railway dashboard volume capacity tracking
- **Upload Performance**: Monitor file processing times
- **Cleanup Operations**: Track automated file cleanup via `FILE_CLEANUP_INTERVAL`
- **Permissions Health**: Validate `RAILWAY_RUN_UID=0` configuration

### **Multi-Tenant Monitoring**
- **Domain Resolution**: Track tenant domain-to-account mapping
- **Cache Performance**: Monitor `TENANT_CACHE_TTL` effectiveness
- **SSL Certificate Status**: Automatic Let's Encrypt certificate monitoring
- **Cross-Origin Security**: CORS configuration validation

### **Performance Benchmarks**
- **Response Times**: API endpoints < 200ms average
- **Database Queries**: < 500ms for complex operations
- **File Uploads**: < 2 seconds for typical images
- **Cache Hit Rate**: > 80% for tenant lookups
- **Deployment Time**: < 2 minutes with zero downtime

---

## 🔒 **Backup and Disaster Recovery**

### **Database Backup Strategy**
- **Automatic Backups**: Railway PostgreSQL daily automated backups
- **Retention Policy**: 7-day backup retention (Railway default)
- **Point-in-Time Recovery**: Available via Railway dashboard
- **Cross-Region**: Backups stored in Railway's infrastructure
- **Restore Testing**: Monthly backup restore validation

### **File Storage Backup**
```bash
# Backend Service - Backup Configuration
BACKUP_INTERVAL=daily             # File backup frequency
BACKUP_RETENTION_DAYS=30          # Local file retention
S3_BACKUP_ENABLED=false           # Optional: External backup to S3
S3_BACKUP_BUCKET=draco-backups    # S3 bucket for file backups
```

### **Configuration Backup**
- **Environment Variables**: Document all production configurations
- **Volume Configuration**: Backup volume mount and permission settings
- **Domain Configuration**: Maintain list of all custom domains
- **SSL Certificates**: Railway manages certificate backup automatically

### **Disaster Recovery Procedures**
1. **Database Recovery**: 
   - Use Railway dashboard for point-in-time restore
   - Validate data integrity post-recovery
   - Update connection strings if necessary

2. **File Storage Recovery**:
   - Restore from volume snapshots via Railway
   - Verify file permissions and access
   - Validate tenant file organization

3. **Service Recovery**:
   - Redeploy services from Git repositories
   - Restore environment variables from documentation
   - Validate private network connectivity

4. **Domain Recovery**:
   - Re-add custom domains via Railway dashboard
   - Verify SSL certificate regeneration
   - Test tenant domain resolution

### **Recovery Time Objectives (RTO)**
- **Database Recovery**: < 30 minutes
- **File Storage Recovery**: < 1 hour
- **Service Deployment**: < 15 minutes
- **Full System Recovery**: < 2 hours

### **Recovery Point Objectives (RPO)**
- **Database Data Loss**: < 24 hours (daily backups)
- **File Storage Loss**: < 1 hour (with optional S3 sync)
- **Configuration Loss**: < 1 hour (documented configurations)

---

## 🎯 **Success Criteria**

### **Core Infrastructure**
✅ **All services deploy successfully with zero downtime**  
✅ **Database connectivity works via private network**  
✅ **Frontend communicates with backend via `RAILWAY_PRIVATE_DOMAIN`**  
✅ **File uploads persist across deployments with proper permissions**  
✅ **Volumes have correct `RAILWAY_RUN_UID=0` configuration**  

### **Security and Performance**
✅ **Private networking between all services established**  
✅ **Security hardening enabled (rate limiting, CORS, CSP)**  
✅ **Query logging controllable via `ENABLE_QUERY_LOGGING`**  
✅ **Deployment overlap configured for zero downtime**  
✅ **Health checks configured with appropriate timeouts**  
✅ **Compression works in production**  
✅ **Performance meets or exceeds local development**  

### **Multi-Tenant Functionality**
✅ **Multi-tenant domain resolution works with caching**  
✅ **SSL certificates generate automatically for all domains**  
✅ **Tenant isolation works correctly with account boundaries**  
✅ **Domain-to-account caching performs at > 80% hit rate**  

### **Monitoring and Reliability**
✅ **Application-level monitoring configured and functional**  
✅ **Database query performance monitoring active**  
✅ **File storage monitoring and cleanup operational**  
✅ **Backup and disaster recovery procedures validated**  
✅ **Performance benchmarks met (API < 200ms, DB < 500ms)**  

### **Production Readiness**
✅ **All environment variables properly configured for production**  
✅ **Graceful shutdown procedures working (`RAILWAY_DEPLOYMENT_DRAINING_SECONDS`)**  
✅ **Resource optimization configured (connection pooling, file limits)**  
✅ **Documentation complete for tenant onboarding and operations**  

---

## 🔍 **Pre-Deployment Checklist**

### **Code Preparation**
- [ ] Ensure all environment variables are configurable
- [ ] Verify database connection string format compatibility with Railway
- [ ] Test file upload paths are configurable and use `UPLOAD_PATH`
- [ ] Confirm compression middleware is production-ready
- [ ] Validate `ENABLE_QUERY_LOGGING` environment variable integration
- [ ] Test private network communication using `RAILWAY_PRIVATE_DOMAIN`
- [ ] Verify security middleware (rate limiting, CORS, CSP) is configurable
- [ ] Confirm graceful shutdown handling is implemented

### **Database Preparation**
- [ ] Export current database schema
- [ ] Prepare migration scripts
- [ ] Backup existing data (if applicable)
- [ ] Test database connection with Railway format

### **File Storage Preparation**
- [ ] Verify upload directory paths are configurable via `UPLOAD_PATH`
- [ ] Test file persistence across restarts with volumes
- [ ] Ensure proper file permissions with `RAILWAY_RUN_UID=0`
- [ ] Test tenant-based file organization structure
- [ ] Validate file size limits via `MAX_FILE_SIZE`
- [ ] Test file type restrictions via `ALLOWED_FILE_TYPES`
- [ ] Verify file cleanup automation via `FILE_CLEANUP_INTERVAL`

---

## 🚨 **Post-Deployment Verification**

### **Immediate Checks**
- [ ] All services are running
- [ ] Database connections established
- [ ] File uploads working
- [ ] Frontend accessible via primary domain
- [ ] API endpoints responding

### **Multi-Tenant Verification**
- [ ] Custom domain resolution working
- [ ] SSL certificates generated
- [ ] Tenant isolation maintained
- [ ] Account routing functioning

### **Performance Verification**
- [ ] Compression working in production
- [ ] Response times acceptable
- [ ] File upload performance good
- [ ] Database query performance maintained

---

## 📚 **Useful Railway Commands**

### **Project Management**
```bash
railway init                    # Initialize new project
railway link                    # Link local directory to project
railway status                  # Check project status
```

### **Service Management**
```bash
railway add                     # Add new service
railway add -d postgres         # Add PostgreSQL database
railway up                      # Deploy service
railway logs                    # View service logs
```

### **Domain Management**
```bash
railway domain                  # Generate domain for service
railway variables               # Manage environment variables
```

---

## 🔗 **Railway Documentation References**

- **Main Documentation**: https://railway.app/docs
- **CLI Reference**: https://railway.app/docs/reference/cli
- **Environment Variables**: https://railway.app/docs/guides/variables
- **Custom Domains**: https://railway.app/docs/guides/custom-domains
- **Volumes**: https://railway.app/docs/reference/volumes

---

## 📝 **Notes**

- Railway automatically handles SSL certificates for all domains
- Private networking between services reduces costs
- Volumes provide persistent storage across deployments
- Multi-tenant setup requires no additional Railway services
- Existing middleware.ts handles tenant domain resolution
- Compression middleware is already production-ready

---

## 🔄 **Key Improvements Made**

### **Security Enhancements**
- **Private Networking**: All service communication via `RAILWAY_PRIVATE_DOMAIN`
- **Volume Permissions**: Proper `RAILWAY_RUN_UID=0` configuration for file access
- **Security Hardening**: Rate limiting, CORS restrictions, and Content Security Policy
- **Production Secrets**: Use Railway's secret generation for JWT and other sensitive data

### **Performance Optimizations**
- **Zero Downtime Deployments**: `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS` configuration
- **Connection Pooling**: Optimized database connections for Railway's infrastructure
- **Query Control**: Environment-controlled SQL logging via `ENABLE_QUERY_LOGGING`
- **Tenant Caching**: 1-hour cache TTL for domain-to-account resolution
- **Graceful Shutdown**: Proper draining time with `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`

### **Monitoring and Reliability**
- **Comprehensive Monitoring**: Application, database, and infrastructure monitoring
- **Performance Benchmarks**: Specific targets for response times and cache hit rates
- **Backup Strategy**: Automated backups with defined RTO/RPO objectives
- **Disaster Recovery**: Complete procedures for system restoration

### **Production Readiness**
- **Resource Limits**: File size, type restrictions, and cleanup automation
- **Health Checks**: Configurable timeouts and monitoring
- **Environment Controls**: Production-specific configurations and optimizations
- **Documentation**: Complete operational procedures and troubleshooting guides

---

*This document should be updated as implementation progresses and lessons are learned.*
