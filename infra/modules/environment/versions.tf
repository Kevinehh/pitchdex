terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
      # CloudFront only accepts certificates from us-east-1, whatever region the rest runs in.
      configuration_aliases = [aws.us_east_1]
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  prefix       = "pitchdex-${var.name}"
  account_id   = data.aws_caller_identity.current.account_id
  region       = data.aws_region.current.region
  uses_unipile = var.unipile_base_url != null
}
