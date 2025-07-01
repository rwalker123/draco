# Draco AWS Deployment

This directory contains the AWS deployment configuration for the Draco Sports Manager application using a **serverless architecture**.

## Why Serverless?

For a low-traffic sports management application, serverless provides significant cost savings:

- **60-70% cost reduction** compared to traditional container deployments
- **Pay-per-use** - only pay when the application is used
- **Automatic scaling** - handles traffic spikes without manual intervention
- **Lower maintenance** - no server management required

## Quick Start

1. **Navigate to the serverless deployment directory:**
   ```bash
   cd aws-deployment/serverless
   ```

2. **Follow the detailed guide:**
   ```bash
   cat README.md
   ```

## Architecture

The deployment now uses:
- **Frontend**: Deployed via Vercel (Next.js)
- **Backend**: AWS Lambda + API Gateway for the backend API, RDS PostgreSQL for the database

> **Note:** The previous S3/CloudFront static hosting for the frontend is no longer used. All frontend deployment is handled by Vercel. The backend API is deployed to AWS as described below.

## Cost Comparison

| Service | Serverless | Traditional ECS |
|---------|------------|-----------------|
| Backend | ~$5-15/month | ~$50-100/month |
| Frontend | ~$1-5/month | ~$20-40/month |
| Database | ~$15-30/month | ~$15-30/month |
| **Total** | **~$21-50/month** | **~$85-170/month** |

## Deployment

```bash
# Full deployment
./aws-deployment/serverless/deploy.sh

# Or step by step
./aws-deployment/serverless/deploy.sh secrets
./aws-deployment/serverless/deploy.sh infrastructure
./aws-deployment/serverless/deploy.sh lambda
./aws-deployment/serverless/deploy.sh frontend
```

## Documentation

- [Serverless Deployment Guide](serverless/README.md) - Complete setup and deployment instructions
- [Troubleshooting](serverless/README.md#troubleshooting) - Common issues and solutions
- [Cost Optimization](serverless/README.md#cost-optimization-tips) - Tips for minimizing costs 

## Current Structure:
```
aws-deployment/
├── README.md                    # Main deployment overview
└── serverless/
    ├── README.md               # Detailed serverless guide
    ├── main.tf                 # Serverless infrastructure
    ├── variables.tf            # Terraform variables
    ├── terraform.tfvars.example # Configuration template
    └── deploy.sh               # Serverless deployment script
```

Your deployment is now focused entirely on the cost-effective serverless approach. The setup is much cleaner and you'll save 60-70% on hosting costs compared to the ECS approach.

Ready to deploy? Just run:
```bash
cd aws-deployment/serverless
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
./deploy.sh 