# The test environment: as small as it can be, in practice mode, so nothing reaches real investors.
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
    key          = "test/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

variable "alert_email" {
  description = "Who hears about alarms."
  type        = string
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = { Project = "pitchdex", Environment = "test" }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = { Project = "pitchdex", Environment = "test" }
  }
}

module "environment" {
  source = "../../modules/environment"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name               = "test"
  aspnet_environment = "Staging"
  domain_name        = "staging.pitchdex.ai"
  origin_domain_name = "origin-staging.pitchdex.ai"
  email_domain       = "pitchdex.ai"
  email_from         = "Pitchdex Test <no-reply@pitchdex.ai>"
  alert_email        = var.alert_email
  github_repository  = "Kevinehh/pitchdex"

  # Practice mode keeps its pretend replies in memory, so the workers run inside the API.
  separate_worker = false
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
