#!/bin/bash

# LocalStack helper script for Draco
# This script provides easy commands for managing LocalStack S3 operations

LOCALSTACK_ENDPOINT="http://localhost:4566"
BUCKET_NAME="draco-team-logos"
AWS_CREDS="AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1"

# Function to run AWS CLI commands with LocalStack config
run_aws() {
    $AWS_CREDS aws --endpoint-url=$LOCALSTACK_ENDPOINT "$@"
}

case "$1" in
    "start")
        echo "Starting LocalStack..."
        docker-compose up -d localstack
        echo "Waiting for LocalStack to be ready..."
        sleep 5
        echo "LocalStack is running at $LOCALSTACK_ENDPOINT"
        ;;
    "stop")
        echo "Stopping LocalStack..."
        docker-compose down
        ;;
    "status")
        echo "Checking LocalStack status..."
        curl -s $LOCALSTACK_ENDPOINT/_localstack/health | jq '.services.s3' 2>/dev/null || echo "S3: unknown"
        ;;
    "create-bucket")
        echo "Creating S3 bucket: $BUCKET_NAME"
        run_aws s3 mb s3://$BUCKET_NAME
        ;;
    "list-buckets")
        echo "Listing S3 buckets:"
        run_aws s3 ls
        ;;
    "list-objects")
        echo "Listing objects in $BUCKET_NAME:"
        run_aws s3 ls s3://$BUCKET_NAME
        ;;
    "upload")
        if [ -z "$2" ]; then
            echo "Usage: $0 upload <local-file-path> [s3-key]"
            exit 1
        fi
        local_file="$2"
        s3_key="${3:-$(basename $local_file)}"
        echo "Uploading $local_file to s3://$BUCKET_NAME/$s3_key"
        run_aws s3 cp "$local_file" s3://$BUCKET_NAME/$s3_key
        ;;
    "download")
        if [ -z "$2" ]; then
            echo "Usage: $0 download <s3-key> [local-file-path]"
            exit 1
        fi
        s3_key="$2"
        local_file="${3:-$(basename $s3_key)}"
        echo "Downloading s3://$BUCKET_NAME/$s3_key to $local_file"
        run_aws s3 cp s3://$BUCKET_NAME/$s3_key "$local_file"
        ;;
    "delete")
        if [ -z "$2" ]; then
            echo "Usage: $0 delete <s3-key>"
            exit 1
        fi
        s3_key="$2"
        echo "Deleting s3://$BUCKET_NAME/$s3_key"
        run_aws s3 rm s3://$BUCKET_NAME/$s3_key
        ;;
    "setup")
        echo "Setting up LocalStack for Draco..."
        echo "1. Starting LocalStack..."
        docker-compose up -d localstack
        echo "2. Waiting for LocalStack to be ready..."
        sleep 10
        echo "3. Creating S3 bucket..."
        run_aws s3 mb s3://$BUCKET_NAME
        echo "4. Verifying setup..."
        run_aws s3 ls
        echo "LocalStack setup complete!"
        ;;
    *)
        echo "LocalStack helper script for Draco"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start         - Start LocalStack"
        echo "  stop          - Stop LocalStack"
        echo "  status        - Check LocalStack status"
        echo "  setup         - Complete setup (start + create bucket)"
        echo "  create-bucket - Create the S3 bucket"
        echo "  list-buckets  - List all S3 buckets"
        echo "  list-objects  - List objects in the bucket"
        echo "  upload <file> [key] - Upload a file to S3"
        echo "  download <key> [file] - Download a file from S3"
        echo "  delete <key>  - Delete a file from S3"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 upload logo.png team-logos/logo.png"
        echo "  $0 list-objects"
        ;;
esac 