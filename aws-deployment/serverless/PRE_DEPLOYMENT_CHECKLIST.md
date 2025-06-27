# Pre-Deployment Checklist

## AWS Prerequisites

### ✅ AWS CLI Setup
```bash
aws configure
# Enter your AWS credentials and region (us-east-1)
```

### ✅ S3 Bucket for Terraform State
```bash
# Create the required S3 bucket
aws s3 mb s3://draco-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning --bucket draco-terraform-state --versioning-configuration Status=Enabled
```

### ✅ Verify AWS Account Limits
Check that you have sufficient limits for:
- RDS: At least 1 DB instance
- Lambda: At least 1000 concurrent executions  
- VPC: At least 5 VPCs
- ECR: At least 1 repository

## Local Setup

### ✅ Environment Configuration
```bash
cd aws-deployment/serverless
cp env.example .env
# Edit .env with your actual values
```

### ✅ Terraform Configuration
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your non-sensitive config
```

## Database Migration Strategy

Choose one of the following approaches:

### Option A: Fresh Start (Recommended for testing)
```bash
# Deploy everything
./deploy.sh

# Then run your migration scripts
cd draco-nodejs/backend
npm run migrate-passwords
```

### Option B: Import Existing Data
```bash
# 1. Deploy infrastructure only
./deploy.sh infrastructure

# 2. Get RDS endpoint
terraform output database_endpoint

# 3. Import your data
psql -h YOUR_RDS_ENDPOINT -U draco -d draco -f your_existing_dump.sql

# 4. Deploy application
./deploy.sh lambda
./deploy.sh frontend
```

### Option C: Use Migration Scripts
```bash
# 1. Deploy infrastructure
./deploy.sh infrastructure

# 2. Set database URL
export DATABASE_URL="postgresql://draco:YOUR_PASSWORD@YOUR_RDS_ENDPOINT/draco"

# 3. Run migrations
cd draco-nodejs/backend
npm run migrate-passwords
npm run test-passwords

# 4. Deploy application
cd ../../aws-deployment/serverless
./deploy.sh lambda
./deploy.sh frontend
```

## Cost Considerations

### Development Environment
- RDS: ~$15/month (db.t3.micro)
- Lambda: ~$5-15/month (pay per request)
- CloudFront: ~$1-5/month
- **Total: ~$21-35/month**

### Production Environment
- RDS: ~$30-60/month (db.t3.small or larger)
- Lambda: ~$10-30/month (higher traffic)
- CloudFront: ~$5-15/month
- **Total: ~$45-105/month**

## Post-Deployment Verification

After deployment, verify:

1. **Lambda Function**: Check CloudWatch logs
2. **API Gateway**: Test health endpoint
3. **Frontend**: Visit CloudFront URL
4. **Database**: Connect and verify data
5. **Email**: Test password reset functionality

## Troubleshooting

### Common Issues
- **S3 Bucket Already Exists**: Use a different bucket name in main.tf
- **VPC Limits**: Request limit increase from AWS
- **Database Connection**: Check security groups and credentials
- **Lambda Timeout**: Increase timeout in main.tf

### Useful Commands
```bash
# Check AWS account
aws sts get-caller-identity

# List S3 buckets
aws s3 ls

# Check RDS instances
aws rds describe-db-instances

# View Lambda logs
aws logs tail /aws/lambda/draco-backend-dev --follow
``` 