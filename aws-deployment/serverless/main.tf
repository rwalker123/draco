terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "draco-terraform-state"
    key    = "draco/serverless.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Draco"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking (minimal for RDS only)
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  
  name = "draco-serverless-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
  enable_vpn_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "draco" {
  name       = "draco-serverless-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "Draco Serverless DB subnet group"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "draco-serverless-rds-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "draco" {
  identifier = "draco-serverless-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "draco"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.draco.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment == "dev"
  
  tags = {
    Name = "Draco Serverless Database"
  }
}

# Lambda Function
resource "aws_lambda_function" "draco_backend" {
  filename         = "draco-backend.zip"
  function_name    = "draco-backend-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/src/server.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512
  
  environment {
    variables = {
      NODE_ENV     = "production"
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.draco.endpoint}/${aws_db_instance.draco.db_name}"
      JWT_SECRET   = var.jwt_secret
      EMAIL_HOST   = var.email_host
      EMAIL_PORT   = var.email_port
      EMAIL_USER   = var.email_user
      EMAIL_PASS   = var.email_pass
    }
  }
  
  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.lambda_execution_role_policy,
    aws_cloudwatch_log_group.lambda
  ]
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "draco-serverless-lambda-"
  vpc_id      = module.vpc.vpc_id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "draco" {
  name = "draco-api-${var.environment}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.draco.id
  parent_id   = aws_api_gateway_rest_api.draco.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.draco.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.draco.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.draco_backend.invoke_arn
}

resource "aws_api_gateway_method" "proxy_root" {
  rest_api_id   = aws_api_gateway_rest_api.draco.id
  resource_id   = aws_api_gateway_rest_api.draco.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id = aws_api_gateway_rest_api.draco.id
  resource_id = aws_api_gateway_rest_api.draco.root_resource_id
  http_method = aws_api_gateway_method.proxy_root.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.draco_backend.invoke_arn
}

resource "aws_api_gateway_deployment" "draco" {
  depends_on = [
    aws_api_gateway_integration.lambda,
    aws_api_gateway_integration.lambda_root,
  ]
  
  rest_api_id = aws_api_gateway_rest_api.draco.id
  stage_name  = var.environment
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.draco_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.draco.execution_arn}/*/*"
}

# IAM Roles
resource "aws_iam_role" "lambda_execution_role" {
  name = "draco-serverless-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_execution_role_policy" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/draco-backend-${var.environment}"
  retention_in_days = 30
}

# Outputs
output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = aws_api_gateway_deployment.draco.invoke_url
}

output "database_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.draco.endpoint
}

# S3 Bucket for Account Resources (images, documents, etc)
resource "aws_s3_bucket" "account_resources" {
  bucket = "draco-account-resources-${var.environment}"

  force_destroy = true

  tags = {
    Name        = "Draco Account Resources"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "account_resources" {
  bucket = aws_s3_bucket.account_resources.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "account_resources_bucket_name" {
  description = "The name of the S3 bucket for account resources (images, documents, etc)"
  value       = aws_s3_bucket.account_resources.bucket
}

# IAM Policy for Lambda to access Account Resources S3 Bucket
resource "aws_iam_policy" "lambda_s3_account_resources" {
  name        = "draco-lambda-s3-account-resources-${var.environment}"
  description = "Allow Lambda to read/write/delete/list objects in the account resources S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.account_resources.arn,
          "${aws_s3_bucket.account_resources.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "lambda_s3_account_resources" {
  name       = "lambda-s3-account-resources-attach-${var.environment}"
  roles      = [aws_iam_role.lambda_execution_role.name]
  policy_arn = aws_iam_policy.lambda_s3_account_resources.arn
} 