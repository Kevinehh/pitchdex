# SES proves we own the domain through DKIM records in DNS (listed in the dns_records output).
# A new account can only email verified addresses until AWS approves it for production.
resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.email_domain
}
