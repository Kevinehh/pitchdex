resource "aws_ecr_repository" "api" {
  name                 = "${local.prefix}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 20 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${local.prefix}"
  retention_in_days = 30
}

resource "aws_ecs_cluster" "main" {
  name = local.prefix
}

# --- Permissions ---

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# What AWS needs to start a container: pull its image, write its logs, hand it its secrets.
resource "aws_iam_role" "execution" {
  name               = "${local.prefix}-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

locals {
  secrets = merge(
    { ConnectionStrings__Default = aws_secretsmanager_secret.connection_string.arn },
    local.uses_unipile ? {
      Messaging__WebhookSecret = aws_secretsmanager_secret.webhook[0].arn
      Messaging__UnipileApiKey = aws_secretsmanager_secret.unipile_api_key[0].arn
    } : {},
  )
  key_parameter_path = "/${local.prefix}/data-protection"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = values(local.secrets)
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

# What the app itself may do once it's running.
resource "aws_iam_role" "task" {
  name               = "${local.prefix}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

data "aws_iam_policy_document" "task" {
  statement {
    sid       = "EncryptionKeys"
    actions   = ["ssm:GetParametersByPath", "ssm:PutParameter"]
    resources = ["arn:aws:ssm:${local.region}:${local.account_id}:parameter${local.key_parameter_path}*"]
  }

  statement {
    sid       = "PasswordResetEmail"
    actions   = ["ses:SendEmail"]
    resources = ["arn:aws:ses:${local.region}:${local.account_id}:identity/*"]
  }

  statement {
    sid       = "InvestorImports"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.imports.arn}/*"]
  }
}

resource "aws_iam_role_policy" "task" {
  name   = "app"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

# --- Investor imports: a private bucket that the import command reads a CSV from ---

resource "aws_s3_bucket" "imports" {
  bucket = "${local.prefix}-imports-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "imports" {
  bucket                  = aws_s3_bucket.imports.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# These files hold real people's details, so they don't stay after the import.
resource "aws_s3_bucket_lifecycle_configuration" "imports" {
  bucket = aws_s3_bucket.imports.id

  rule {
    id     = "expire"
    status = "Enabled"
    filter {}
    expiration {
      days = 30
    }
  }
}

# --- Containers ---

locals {
  base_environment = merge(
    {
      ASPNETCORE_ENVIRONMENT        = var.aspnet_environment
      AWS_REGION                    = local.region
      DataProtection__ParameterPath = local.key_parameter_path
      Email__FromAddress            = var.email_from
      Messaging__FrontendUrl        = "https://${var.domain_name}"
      # CloudFront, then the load balancer.
      Proxy__Hops = "2"
    },
    local.uses_unipile ? {
      Messaging__PublicApiUrl   = "https://${var.domain_name}"
      Messaging__UnipileBaseUrl = var.unipile_base_url
    } : {},
  )

  # Deploys replace the image. Until the first one, nothing can start: that's expected.
  first_image = "${aws_ecr_repository.api.repository_url}:first-deploy"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name         = "api"
    image        = local.first_image
    essential    = true
    portMappings = [{ containerPort = 8080, protocol = "tcp" }]
    environment = [
      for key, value in merge(local.base_environment, { Workers__Enabled = tostring(!var.separate_worker) }) :
      { name = key, value = value }
    ]
    secrets = [for key, arn in local.secrets : { name = key, valueFrom = arn }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = local.region
        awslogs-stream-prefix = "api"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "worker" {
  count                    = var.separate_worker ? 1 : 0
  family                   = "${local.prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = "worker"
    image     = local.first_image
    essential = true
    environment = [
      for key, value in merge(local.base_environment, { Workers__Enabled = "true" }) :
      { name = key, value = value }
    ]
    secrets = [for key, arn in local.secrets : { name = key, valueFrom = arn }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = local.region
        awslogs-stream-prefix = "worker"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  # With the workers inside it, there can only ever be one, so the old stops before the new starts.
  deployment_minimum_healthy_percent = var.separate_worker ? 100 : 0
  deployment_maximum_percent         = var.separate_worker ? 200 : 100
  health_check_grace_period_seconds  = 90

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 8080
  }

  lifecycle {
    # Deploys move this on; Terraform shouldn't move it back.
    ignore_changes = [task_definition]

    precondition {
      condition     = var.separate_worker || var.api_desired_count == 1
      error_message = "With the workers inside the API, run exactly one API container: only one may send."
    }
  }

  depends_on = [aws_lb_listener_rule.from_cloudfront]
}

resource "aws_ecs_service" "worker" {
  count           = var.separate_worker ? 1 : 0
  name            = "worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker[0].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # Only one may send at a time, so the old one stops before the new one starts.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
