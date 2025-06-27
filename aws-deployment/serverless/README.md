# Draco Serverless AWS Deployment Guide

This guide provides instructions for deploying the Draco Sports Manager application to AWS using a serverless architecture. This approach is **much more cost-effective** for low-traffic applications.

## Architecture Overview

The serverless deployment uses the following AWS services:

- **AWS Lambda**: Serverless backend API (pay per request)
- **API Gateway**: HTTP API management and routing
- **RDS PostgreSQL**: Managed database service
- **S3**: Static file hosting for frontend
- **CloudFront**: Global CDN for frontend and API caching
- **CloudWatch**: Logging and monitoring
- **Route53**: DNS management (optional)
- **ACM**: SSL certificate management

## Cost Comparison

### Serverless vs ECS Fargate (Monthly costs for low traffic)

| Service | Serverless | ECS Fargate |
|---------|------------|-------------|
| Backend | ~$5-15 | ~$50-100 |
| Frontend | ~$1-5 | ~$20-40 |
| Database | ~$15-30 | ~$15-30 |
| **Total** | **~$21-50** | **~$85-170** |

*Savings: 60-70% for low-traffic applications*

## Prerequisites

Before deploying, ensure you have the following installed and configured:

1. **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **Terraform** - [Installation Guide](https://developer.hashicorp.com/terraform/downloads)
3. **Node.js** - [Installation Guide](https://nodejs.org/)
4. **AWS Credentials** - Configure with `aws configure`

## Quick Start

### 1. Configure Environment Variables

Create your environment file with sensitive data:

```bash
cd aws-deployment/serverless
cp env.example .env
```

Edit `.env` with your actual values:

```bash
# Database Configuration
TF_VAR_db_password=your-actual-secure-password

# JWT Configuration
TF_VAR_jwt_secret=your-actual-jwt-secret

# Email Configuration
TF_VAR_email_user=your-actual-email@example.com
TF_VAR_email_pass=your-actual-email-password

# Optional Email Server Configuration
TF_VAR_email_host=smtp.gmail.com
TF_VAR_email_port=587
```

### 2. Configure Terraform Variables

Copy and edit the Terraform configuration:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your non-sensitive configuration:

```hcl
aws_region = "us-east-1"
environment = "dev"
domain_name = "your-domain.com"  # Optional
db_username = "draco"
```

### 3. Deploy

Run the deployment script:

```bash
./deploy.sh
```

The script will automatically:
- Load environment variables from `.env`
- Verify all required variables are set
- Build and package the Lambda function
- Deploy infrastructure with Terraform
- Update the Lambda function
- Build and deploy the frontend to S3/CloudFront

## Deployment Options

The deployment script supports different modes:

```bash
# Full deployment (default)
./deploy.sh

# Build Lambda package only
./deploy.sh build

# Deploy infrastructure only
./deploy.sh infrastructure

# Build and deploy frontend only
./deploy.sh frontend

# Update Lambda function only
./deploy.sh lambda
```

## Security Best Practices

### Environment Variables
- **Never** store sensitive data in `terraform.tfvars`
- Use `.env` file for sensitive data (automatically loaded by deploy script)
- `.env` file is gitignored and should never be committed
- Use `TF_VAR_*` environment variables for Terraform

### File Structure
```
aws-deployment/serverless/
├── .env                    # Your sensitive data (not committed)
├── env.example            # Example template (committed)
├── terraform.tfvars       # Non-sensitive config (committed)
├── terraform.tfvars.example # Example template (committed)
└── deploy.sh              # Deployment script
```

### Git Safety
The `.env` file should be in your `.gitignore`:

```bash
# Add to .gitignore
aws-deployment/serverless/.env
```

## Infrastructure Components

### Lambda Function
- Node.js 18.x runtime
- 512MB memory allocation
- 30-second timeout
- VPC access for RDS connectivity
- Automatic scaling (0 to thousands of concurrent executions)
- Environment variables for configuration (loaded from .env)

### API Gateway
- Regional endpoint for lower latency
- Automatic HTTPS termination
- CORS support
- Request/response transformation

### Database
- RDS PostgreSQL in private subnets
- Automated backups and maintenance
- Encryption at rest enabled
- Minimal instance class for cost optimization

### Frontend Hosting
- S3 bucket for static files
- CloudFront distribution for global CDN
- Automatic cache invalidation on deployment
- HTTPS enforcement

## Environment Variables

### Lambda Environment Variables
- `NODE_ENV`: Set to "production"
- `DATABASE_URL`: PostgreSQL connection string (auto-generated)
- `JWT_SECRET`: JWT signing secret (from TF_VAR_jwt_secret)
- `EMAIL_HOST`: SMTP host (from TF_VAR_email_host)
- `EMAIL_PORT`: SMTP port (from TF_VAR_email_port)
- `EMAIL_USER`: SMTP username (from TF_VAR_email_user)
- `EMAIL_PASS`: SMTP password (from TF_VAR_email_pass)

### Frontend Environment Variables
- `REACT_APP_API_URL`: API Gateway URL (automatically set)

## Monitoring and Logging

### CloudWatch Logs
- Lambda function logs automatically sent to CloudWatch
- Log group: `/aws/lambda/draco-backend-{environment}`
- 30-day retention policy
- Structured logging with request IDs

### Metrics
- Lambda invocation count and duration
- API Gateway request count and latency
- CloudFront cache hit rates
- RDS connection count and performance

## Scaling

### Automatic Scaling
- Lambda automatically scales from 0 to thousands of concurrent executions
- No manual scaling required
- Pay only for actual usage

### Performance Optimization
- Lambda cold start optimization with provisioned concurrency (optional)
- CloudFront caching for static assets
- Database connection pooling

## Security

### Network Security
- Lambda runs in private subnets
- RDS not publicly accessible
- Security groups restrict access to necessary ports only

### Secrets Management
- Sensitive data loaded from `.env` file
- No AWS Secrets Manager required (simpler setup)
- IAM roles with least privilege access

### SSL/TLS
- API Gateway provides HTTPS termination
- CloudFront enforces HTTPS
- ACM certificate for custom domains

## Cost Optimization Tips

### Development Environment
- Use `db.t3.micro` for RDS
- Minimal Lambda memory allocation (512MB)
- CloudFront price class 100 (US/Canada/Europe only)

### Production Environment
- Use `db.t3.small` or larger for RDS
- Consider RDS Multi-AZ for high availability
- Increase Lambda memory if needed for performance

### Monitoring Costs
- Set up CloudWatch alarms for cost monitoring
- Use AWS Cost Explorer to track spending
- Consider AWS Budgets for cost alerts

## Troubleshooting

### Common Issues

1. **Missing .env File**
   ```bash
   # Create .env file from template
   cp env.example .env
   # Edit .env with your actual values
   ```

2. **Missing Environment Variables**
   ```bash
   # Check if .env file exists and has correct format
   cat aws-deployment/serverless/.env
   
   # Verify variables are loaded
   env | grep TF_VAR
   ```

3. **Lambda Cold Starts**
   - First request may be slow (1-3 seconds)
   - Subsequent requests are fast (<100ms)
   - Consider provisioned concurrency for consistent performance

4. **Database Connection Issues**
   - Lambda functions in VPC have longer cold starts
   - Use connection pooling in your application
   - Consider RDS Proxy for connection management

5. **API Gateway Timeouts**
   - Default timeout is 29 seconds
   - Increase Lambda timeout if needed
   - Optimize database queries

6. **CloudFront Cache Issues**
   - Cache invalidation takes 5-10 minutes
   - Use versioned file names for immediate updates
   - Check cache behavior settings

### Useful Commands

```bash
# Check Lambda function status
aws lambda get-function --function-name draco-backend-dev

# View Lambda logs
aws logs tail /aws/lambda/draco-backend-dev --follow

# Test API Gateway
curl -X GET https://your-api-gateway-url/dev/health

# Check CloudFront distribution
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Monitor costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost

# Verify environment variables
env | grep TF_VAR

# Check .env file format
cat aws-deployment/serverless/.env
```

## Performance Considerations

### Lambda Optimization
- Keep dependencies minimal
- Use Lambda layers for shared libraries
- Optimize cold start times
- Consider provisioned concurrency for consistent performance

### Database Optimization
- Use connection pooling
- Optimize queries for Lambda environment
- Consider read replicas for read-heavy workloads
- Use RDS Proxy for connection management

### Frontend Optimization
- Enable CloudFront compression
- Use appropriate cache headers
- Optimize bundle size
- Implement lazy loading

## Cleanup

To destroy the infrastructure:

```bash
cd aws-deployment/serverless
terraform destroy -var-file="terraform.tfvars"
```

**Warning**: This will permanently delete all resources including the database and its data.

## Migration from ECS

If you're migrating from the ECS deployment:

1. Export your data from the existing RDS instance
2. Deploy the serverless infrastructure
3. Import your data to the new RDS instance
4. Update DNS to point to the new CloudFront distribution
5. Destroy the old ECS infrastructure

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs for Lambda errors
3. Verify AWS service limits and quotas
4. Consult AWS documentation for specific services
5. Monitor costs in AWS Cost Explorer 