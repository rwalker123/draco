#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Load environment variables from .env file
load_env_file() {
    local env_file="aws-deployment/serverless/.env"
    
    if [ -f "$env_file" ]; then
        print_status "Loading environment variables from .env file..."
        
        # Read .env file and export variables
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
                # Export the variable
                export "$line"
            fi
        done < "$env_file"
        
        print_status "Environment variables loaded from .env file."
    else
        print_warning ".env file not found at $env_file"
        print_status "You can create it with the following content:"
        echo
        echo "TF_VAR_db_password=your-secure-password"
        echo "TF_VAR_jwt_secret=your-jwt-secret"
        echo "TF_VAR_email_user=your-email@example.com"
        echo "TF_VAR_email_pass=your-email-password"
        echo "TF_VAR_email_host=smtp.gmail.com"
        echo "TF_VAR_email_port=587"
        echo
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists terraform; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "All prerequisites are satisfied."
}

# Check required environment variables
check_environment_variables() {
    print_status "Checking required environment variables..."
    
    local missing_vars=()
    
    if [ -z "$TF_VAR_db_password" ]; then
        missing_vars+=("TF_VAR_db_password")
    fi
    
    if [ -z "$TF_VAR_jwt_secret" ]; then
        missing_vars+=("TF_VAR_jwt_secret")
    fi
    
    if [ -z "$TF_VAR_email_user" ]; then
        missing_vars+=("TF_VAR_email_user")
    fi
    
    if [ -z "$TF_VAR_email_pass" ]; then
        missing_vars+=("TF_VAR_email_pass")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo
        echo "Please create aws-deployment/serverless/.env file with the following content:"
        echo "TF_VAR_db_password=your-secure-password"
        echo "TF_VAR_jwt_secret=your-jwt-secret"
        echo "TF_VAR_email_user=your-email@example.com"
        echo "TF_VAR_email_pass=your-email-password"
        echo "TF_VAR_email_host=smtp.gmail.com"
        echo "TF_VAR_email_port=587"
        echo
        echo "Or set them manually:"
        echo "export TF_VAR_db_password=\"your-secure-password\""
        echo "export TF_VAR_jwt_secret=\"your-jwt-secret\""
        echo "export TF_VAR_email_user=\"your-email@example.com\""
        echo "export TF_VAR_email_pass=\"your-email-password\""
        exit 1
    fi
    
    print_status "All required environment variables are set."
}

# Build Lambda package
build_lambda_package() {
    print_status "Building Lambda package..."
    
    cd draco-nodejs/backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm ci
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Build TypeScript
    print_status "Building TypeScript..."
    npm run build
    
    # Create Lambda package
    print_status "Creating Lambda package..."
    npm run build:lambda
    
    cd ../..
    
    print_status "Lambda package created successfully."
}

# Build and deploy frontend
build_and_deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    cd draco-nodejs/frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm ci
    
    # Build React app
    print_status "Building React app..."
    npm run build
    
    # Get S3 bucket name from Terraform output
    cd ../../aws-deployment/serverless
    S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
    
    if [ -z "$S3_BUCKET" ]; then
        print_error "S3 bucket name not found. Please deploy infrastructure first."
        exit 1
    fi
    
    # Sync to S3
    print_status "Syncing to S3 bucket: $S3_BUCKET"
    aws s3 sync ../../draco-nodejs/frontend/build/ s3://$S3_BUCKET/ --delete
    
    # Invalidate CloudFront cache
    print_status "Invalidating CloudFront cache..."
    CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$S3_BUCKET')].Id" --output text)
    
    if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
        print_status "CloudFront cache invalidation initiated."
    fi
    
    cd ../..
    
    print_status "Frontend deployed successfully."
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd aws-deployment/serverless
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    terraform init
    
    # Plan the deployment
    print_status "Planning Terraform deployment..."
    terraform plan -var-file="terraform.tfvars" -out=tfplan
    
    # Ask for confirmation
    echo
    print_warning "Review the Terraform plan above. Do you want to proceed with the deployment? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    # Apply the plan
    print_status "Applying Terraform plan..."
    terraform apply tfplan
    
    # Get outputs
    print_status "Getting deployment outputs..."
    API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
    DB_ENDPOINT=$(terraform output -raw database_endpoint)
    
    print_status "Deployment completed successfully!"
    print_status "API Gateway URL: $API_GATEWAY_URL"
    print_status "CloudFront URL: $CLOUDFRONT_URL"
    print_status "Database Endpoint: $DB_ENDPOINT"
    
    cd ../..
}

# Update Lambda function
update_lambda() {
    print_status "Updating Lambda function..."
    
    cd draco-nodejs/backend
    
    # Build and package Lambda
    npm run build:lambda
    
    # Update Lambda function
    aws lambda update-function-code \
        --function-name "draco-backend-$ENVIRONMENT" \
        --zip-file fileb://draco-backend.zip \
        --region $AWS_REGION
    
    cd ../..
    
    print_status "Lambda function updated successfully."
}

# Main deployment function
main() {
    print_status "Starting Draco serverless deployment..."
    
    check_prerequisites
    load_env_file
    check_environment_variables
    build_lambda_package
    deploy_infrastructure
    update_lambda
    build_and_deploy_frontend
    
    print_status "Deployment completed successfully!"
    print_status "Your application should be available at the CloudFront URL."
}

# Parse command line arguments
case "${1:-}" in
    "build")
        check_prerequisites
        load_env_file
        build_lambda_package
        ;;
    "infrastructure")
        check_prerequisites
        load_env_file
        check_environment_variables
        deploy_infrastructure
        ;;
    "frontend")
        check_prerequisites
        build_and_deploy_frontend
        ;;
    "lambda")
        check_prerequisites
        update_lambda
        ;;
    "full"|"")
        main
        ;;
    *)
        echo "Usage: $0 {build|infrastructure|frontend|lambda|full}"
        echo "  build         - Build Lambda package only"
        echo "  infrastructure - Deploy infrastructure only"
        echo "  frontend      - Build and deploy frontend only"
        echo "  lambda        - Update Lambda function only"
        echo "  full          - Complete deployment (default)"
        echo
        echo "Environment variables are loaded from aws-deployment/serverless/.env"
        echo "Required variables:"
        echo "  TF_VAR_db_password  - Database password"
        echo "  TF_VAR_jwt_secret   - JWT signing secret"
        echo "  TF_VAR_email_user   - SMTP username"
        echo "  TF_VAR_email_pass   - SMTP password"
        echo
        echo "Example .env file:"
        echo "TF_VAR_db_password=your-secure-password"
        echo "TF_VAR_jwt_secret=your-jwt-secret"
        echo "TF_VAR_email_user=your-email@example.com"
        echo "TF_VAR_email_pass=your-email-password"
        echo "TF_VAR_email_host=smtp.gmail.com"
        echo "TF_VAR_email_port=587"
        exit 1
        ;;
esac 