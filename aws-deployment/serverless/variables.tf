variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "draco"
}

variable "db_password" {
  description = "Database password (from TF_VAR_db_password environment variable)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (from TF_VAR_jwt_secret environment variable)"
  type        = string
  sensitive   = true
}

variable "email_host" {
  description = "SMTP host (from TF_VAR_email_host environment variable)"
  type        = string
  default     = "smtp.gmail.com"
}

variable "email_port" {
  description = "SMTP port (from TF_VAR_email_port environment variable)"
  type        = string
  default     = "587"
}

variable "email_user" {
  description = "SMTP username (from TF_VAR_email_user environment variable)"
  type        = string
  sensitive   = true
}

variable "email_pass" {
  description = "SMTP password (from TF_VAR_email_pass environment variable)"
  type        = string
  sensitive   = true
} 