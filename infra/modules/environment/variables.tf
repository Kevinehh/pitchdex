variable "name" {
  description = "The environment's short name, used in every resource name: test or production."
  type        = string
}

variable "aspnet_environment" {
  description = "ASP.NET's environment name. Staging allows practice mode; Production requires Unipile."
  type        = string

  validation {
    condition     = contains(["Staging", "Production"], var.aspnet_environment)
    error_message = "Use Staging or Production."
  }
}

variable "domain_name" {
  description = "The address founders use, such as staging.pitchdex.ai."
  type        = string
}

variable "origin_domain_name" {
  description = "The load balancer's own address. Only CloudFront connects to it, but HTTPS needs a name."
  type        = string
}

variable "email_domain" {
  description = "The domain password reset emails come from. SES verifies it through DNS records."
  type        = string
}

variable "email_from" {
  description = "The address password reset emails come from."
  type        = string
}

variable "alert_email" {
  description = "Who hears about alarms. AWS emails a confirmation link first."
  type        = string
}

variable "unipile_base_url" {
  description = "Your Unipile DSN. Leave null for practice mode, which only Staging allows."
  type        = string
  default     = null
}

variable "github_repository" {
  description = "The repository allowed to deploy here, as owner/name."
  type        = string
}

variable "vpc_cidr" {
  description = "The network's address range."
  type        = string
  default     = "10.0.0.0/16"
}

variable "task_cpu" {
  description = "CPU for each container, in 1024ths of a vCPU."
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Memory for each container, in MB."
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "How many API containers to run."
  type        = number
  default     = 1
}

variable "separate_worker" {
  description = <<-EOT
    Whether background sending runs in its own container. Practice mode keeps its pretend
    replies in memory, so with practice mode the API has to run the workers itself, in a
    single container.
  EOT
  type        = bool
  default     = true
}

variable "db_instance_class" {
  description = "The database server's size."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_multi_az" {
  description = "Keep a standby database in a second zone, ready to take over."
  type        = bool
  default     = false
}

variable "db_backup_days" {
  description = "How many days of automatic database backups to keep."
  type        = number
  default     = 7
}

variable "protect_data" {
  description = "Refuse to delete the database, and take a final snapshot if it's ever removed."
  type        = bool
  default     = false
}
