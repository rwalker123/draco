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
# ... other configs
```

### **Frontend Service Variables**
```bash
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
# ... other configs
```

### **Volume Configuration**
```bash
# Backend service volume mount
Mount Path: /app/uploads
Volume: draco-uploads

# Database service volume mount
Mount Path: /var/lib/postgresql/data
Volume: draco-database
```

---

## 🚀 **Deployment Process**

### **Phase 2A: Core Infrastructure**
1. Deploy PostgreSQL with persistent volume
2. Deploy backend service with upload volume
3. Run database migrations
4. Test API connectivity
5. Verify file upload functionality

### **Phase 2B: Frontend & Multi-Tenant Setup**
1. Deploy frontend service
2. Generate primary Railway domain
3. Configure cross-service communication
4. Test tenant domain resolution
5. Verify compression still works

### **Phase 2C: Domain Management**
1. Document custom domain setup for tenants
2. Test with sample tenant domains
3. Verify SSL certificate generation
4. Performance testing with multiple tenants
5. Document tenant onboarding process

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

## 🎯 **Success Criteria**

✅ **All services deploy successfully**  
✅ **Database connectivity works**  
✅ **Frontend can communicate with backend**  
✅ **File uploads persist across deployments**  
✅ **Compression works in production**  
✅ **Multi-tenant domain resolution works**  
✅ **SSL certificates generate automatically**  
✅ **Performance meets or exceeds local development**  
✅ **Tenant isolation works correctly**  
✅ **File storage persists across deployments**  

---

## 🔍 **Pre-Deployment Checklist**

### **Code Preparation**
- [ ] Ensure all environment variables are configurable
- [ ] Verify database connection string format compatibility
- [ ] Test file upload paths are configurable
- [ ] Confirm compression middleware is production-ready

### **Database Preparation**
- [ ] Export current database schema
- [ ] Prepare migration scripts
- [ ] Backup existing data (if applicable)
- [ ] Test database connection with Railway format

### **File Storage Preparation**
- [ ] Verify upload directory paths are configurable
- [ ] Test file persistence across restarts
- [ ] Ensure proper file permissions
- [ ] Test tenant-based file organization

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

*This document should be updated as implementation progresses and lessons are learned.*
