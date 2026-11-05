# Production: the real thing, on Unipile, with a standby database and protected data.
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # The bucket is named per account: terraform init -backend-config="bucket=<bootstrap's output>"
  backend "s3" {
    key          = "production/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

variable "alert_email" {
  description = "Who hears about alarms."
  type        = string
}

variable "unipile_base_url" {
  description = "Your Unipile DSN, such as https://api8.unipile.com:13851."
  type        = string
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = { Project = "pitchdex", Environment = "production" }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = { Project = "pitchdex", Environment = "production" }
  }
}

module "environment" {
  source = "../../modules/environment"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name               = "production"
  aspnet_environment = "Production"
  domain_name        = "app.pitchdex.ai"
  origin_domain_name = "origin-app.pitchdex.ai"
  email_domain       = "pitchdex.ai"
  email_from         = "Pitchdex <no-reply@pitchdex.ai>"
  alert_email        = var.alert_email
  github_repository  = "Kevinehh/pitchdex"
  unipile_base_url   = var.unipile_base_url

  task_cpu          = 512
  task_memory       = 1024
  api_desired_count = 2
  separate_worker   = true

  db_instance_class = "db.t4g.small"
  db_multi_az       = true
  db_backup_days    = 14
  protect_data      = true
}

output "first_dns_records" {
  value = module.environment.first_dns_records
}

output "dns_records" {
  value = module.environment.dns_records
}

output "github_variables" {
  value = module.environment.github_variables
}

output "imports_bucket" {
  value = module.environment.imports_bucket
}

output "unipile_api_key_secret" {
  value = module.environment.unipile_api_key_secret
}
