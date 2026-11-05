# Containers read these when they start; they never go in the image or in Git. Terraform's state
# holds the generated ones, which is why its bucket is private and encrypted.

resource "aws_secretsmanager_secret" "connection_string" {
  name                    = "${local.prefix}/connection-string"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "connection_string" {
  secret_id     = aws_secretsmanager_secret.connection_string.id
  secret_string = "Host=${aws_db_instance.main.address};Port=${aws_db_instance.main.port};Database=pitchdex;Username=pitchdex;Password=${random_password.database.result};SSL Mode=Require"
}

resource "random_password" "webhook" {
  count   = local.uses_unipile ? 1 : 0
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "webhook" {
  count                   = local.uses_unipile ? 1 : 0
  name                    = "${local.prefix}/unipile-webhook-secret"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "webhook" {
  count         = local.uses_unipile ? 1 : 0
  secret_id     = aws_secretsmanager_secret.webhook[0].id
  secret_string = random_password.webhook[0].result
}

# Terraform only makes the empty box. The key goes in with the AWS CLI (see infra/README.md),
# so it never lands in Terraform's files.
resource "aws_secretsmanager_secret" "unipile_api_key" {
  count                   = local.uses_unipile ? 1 : 0
  name                    = "${local.prefix}/unipile-api-key"
  recovery_window_in_days = 7
}
