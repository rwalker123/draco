#!/bin/bash

# LocalStack helper script for Draco
# This script provides easy commands for managing LocalStack S3 operations

LOCALSTACK_ENDPOINT="http://localhost:4566"
BUCKET_NAME="${S3_BUCKET:-draco-team-logos}"

# Function to run AWS CLI commands with LocalStack config
run_aws() {
    env AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 aws --endpoint-url=$LOCALSTACK_ENDPOINT "$@"
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
    "list-contact-photos")
        if [ -z "$2" ]; then
            echo "Usage: $0 list-contact-photos <accountId>"
            exit 1
        fi
        account_id="$2"
        echo "Listing contact photos for account $account_id:"
        run_aws s3 ls s3://$BUCKET_NAME/$account_id/contact-photos/
        ;;
    "check-contact-photo")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 check-contact-photo <accountId> <contactId>"
            exit 1
        fi
        account_id="$2"
        contact_id="$3"
        photo_key="$account_id/contact-photos/$contact_id-photo.png"
        echo "Checking if contact photo exists: s3://$BUCKET_NAME/$photo_key"
        if run_aws s3 ls s3://$BUCKET_NAME/$photo_key > /dev/null 2>&1; then
            echo "✅ Contact photo EXISTS"
            run_aws s3 ls s3://$BUCKET_NAME/$photo_key
        else
            echo "❌ Contact photo NOT FOUND"
        fi
        ;;
    "verify-deletion")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 verify-deletion <accountId> <contactId>"
            exit 1
        fi
        account_id="$2"
        contact_id="$3"
        photo_key="$account_id/contact-photos/$contact_id-photo.png"
        echo "Verifying contact photo deletion: s3://$BUCKET_NAME/$photo_key"
        if run_aws s3 ls s3://$BUCKET_NAME/$photo_key > /dev/null 2>&1; then
            echo "❌ DELETION FAILED - Photo still exists:"
            run_aws s3 ls s3://$BUCKET_NAME/$photo_key
        else
            echo "✅ DELETION VERIFIED - Photo successfully deleted"
        fi
        ;;
    "download-contact-photo")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 download-contact-photo <accountId> <contactId> [local-file]"
            exit 1
        fi
        account_id="$2"
        contact_id="$3"
        photo_key="$account_id/contact-photos/$contact_id-photo.png"
        local_file="${4:-contact-$account_id-$contact_id-photo.png}"
        echo "Downloading contact photo: s3://$BUCKET_NAME/$photo_key to $local_file"
        run_aws s3 cp s3://$BUCKET_NAME/$photo_key "$local_file"
        ;;
    "list-all-photos")
        echo "Listing all contact photos in bucket $BUCKET_NAME:"
        run_aws s3 ls s3://$BUCKET_NAME --recursive | grep "contact-photos/"
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
        echo "Contact Photo Commands:"
        echo "  list-contact-photos <accountId> - List contact photos for account"
        echo "  check-contact-photo <accountId> <contactId> - Check if contact photo exists"
        echo "  verify-deletion <accountId> <contactId> - Verify contact photo was deleted"
        echo "  download-contact-photo <accountId> <contactId> [file] - Download contact photo"
        echo "  list-all-photos - List all contact photos in bucket"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 upload logo.png team-logos/logo.png"
        echo "  $0 list-objects"
        echo ""
        echo "Contact Photo Examples:"
        echo "  $0 list-contact-photos 123"
        echo "  $0 check-contact-photo 123 456"
        echo "  $0 verify-deletion 123 456"
        echo "  $0 download-contact-photo 123 456 contact-photo.png"
        ;;
esac 