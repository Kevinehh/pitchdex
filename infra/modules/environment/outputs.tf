# Separate from dns_records because it depends only on the certificates and the email identity,
# so it's readable after the first, partial apply. None of these affect a site that's already live.
output "first_dns_records" {
  description = "The records to add first, so AWS can issue certificates and verify the email domain."
  value = {
    certificates = [
      for option in concat(
        tolist(aws_acm_certificate.web.domain_validation_options),
        tolist(aws_acm_certificate.origin.domain_validation_options),
      ) : { type = option.resource_record_type, name = option.resource_record_name, value = option.resource_record_value }
    ]
    email_dkim = [
      for token in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens : {
        type  = "CNAME"
        name  = "${token}._domainkey.${var.email_domain}"
        value = "${token}.dkim.amazonses.com"
      }
    ]
  }
}

output "dns_records" {
  description = "The records to add once everything exists. See infra/README.md for when."
  value = {
    origin = { type = "CNAME", name = var.origin_domain_name, value = aws_lb.main.dns_name }
    # This one sends founders here, so for production add it last: it's the switch-over.
    site = { type = "CNAME", name = var.domain_name, value = aws_cloudfront_distribution.main.domain_name }
  }
}

output "github_variables" {
  description = "The variables to set on this GitHub environment."
  value = {
    AWS_REGION      = local.region
    AWS_ROLE_ARN    = aws_iam_role.github_deploy.arn
    WEB_BUCKET      = aws_s3_bucket.web.bucket
    DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
  }
}

output "imports_bucket" {
  description = "Where to upload an investor CSV before importing it."
  value       = aws_s3_bucket.imports.bucket
}

output "unipile_api_key_secret" {
  description = "The secret to put the Unipile key in. Empty in practice mode."
  value       = local.uses_unipile ? aws_secretsmanager_secret.unipile_api_key[0].name : null
}
