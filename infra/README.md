# Deploying Pitchdex to AWS

Two environments, each in its own AWS account, built from the same Terraform module.

|  | test | production |
|---|---|---|
| Address | `staging.pitchdex.ai` | `app.pitchdex.ai` |
| ASP.NET environment | `Staging` | `Production` |
| Messaging | Practice mode: nothing reaches real people | Unipile |
| Background sending | Inside the single API container | Its own container |
| Database | Small, one zone | Larger, with a standby, protected from deletion |
| Deploys | Every push to `main` | Run the Deploy workflow by hand |

```
visitor -> CloudFront -> S3                (the web app)
                      -> load balancer -> API containers -> Postgres
                                          worker container -> Unipile, Postgres
```

## First-time setup (once per environment)

Do test first. You need a current AWS CLI signed in to that environment's account, Terraform 1.10
or later, and access to the DNS for `pitchdex.ai`. Terraform asks for `alert_email`, and production
also for `unipile_base_url`; to avoid retyping them, put them in a `terraform.tfvars` file beside
`main.tf`, which Git ignores.

### 1. Create Terraform's state bucket

```bash
cd infra/bootstrap
terraform init
terraform apply
```

Note the `state_bucket` output. This stack's local state files are ignored by Git and only
describe that one bucket.

### 2. Create the certificates and read the DNS records

Certificates need DNS records before anything else can finish, so they come first.

```bash
cd infra/environments/test
terraform init -backend-config="bucket=<state_bucket>"
terraform apply -target=module.environment.aws_acm_certificate.web -target=module.environment.aws_acm_certificate.origin -target=module.environment.aws_sesv2_email_identity.domain
terraform output first_dns_records
```

Add those records to your DNS. None of them affect a site that's already live, including the old
app. Terraform warns that a partial apply is unusual: that's expected for this one step.

### 3. Create everything else

```bash
terraform apply
terraform output dns_records
terraform output github_variables
```

Terraform waits here until AWS sees the certificate records. Then add the `origin` record. For
test, add the `site` record too. **For production, leave `site` until launch day: adding it is
what moves `app.pitchdex.ai` away from the old app.**

AWS emails `alert_email` a link to confirm alarm notifications.

The first deploy hasn't happened yet, so the API service can't start: its image doesn't exist.
That's expected.

### 4. Production only: add the Unipile key

```bash
aws secretsmanager put-secret-value --secret-id "$(terraform output -raw unipile_api_key_secret)" --secret-string "<your key>"
```

Run it from a terminal you trust, since the key lands in your shell history otherwise. It's never
in Terraform or Git.

### 5. Set up GitHub

In the repository's **Settings > Environments**, create `test` and `production`. On each, add the
variables from `terraform output github_variables`. To require a second person's approval for
production, add required reviewers there. GitHub only offers that on private repositories with a
paid plan.

### 6. Ask AWS to let SES email anyone

New accounts can only email verified addresses. In the SES console, request production access for
the production account. Test can stay limited: verify the addresses you test with.

### 7. Deploy

Push to `main` for test, or run **Actions > Deploy** and choose an environment. A deploy:

1. Runs the build and lint checks.
2. Builds and pushes the API image.
3. Runs `migrate` as a one-off container. If it fails, nothing else happens.
4. Rolls out the API and worker, rolling back by itself if the new containers don't become healthy.
5. Uploads the web app.

## Loading investors

Explore is empty until investors are imported, and the survey skips its round, industry and
location questions until then. The file uses the same columns as `data/sample-investors.csv`.
Investors are matched by email, so importing again updates them and never removes anyone.

```bash
aws s3 cp investors.csv "s3://$(terraform output -raw imports_bucket)/investors.csv"
network=$(aws ecs describe-services --cluster pitchdex-test --services api --query 'services[0].networkConfiguration' --output json)
aws ecs run-task --cluster pitchdex-test --launch-type FARGATE --task-definition pitchdex-test-api \
  --network-configuration "$network" \
  --overrides '{"containerOverrides":[{"name":"api","command":["dotnet","Pitchdex.Api.dll","import-investors","s3://<imports_bucket>/investors.csv"]}]}'
```

The result is in CloudWatch, in the `/ecs/pitchdex-test` log group. Use `pitchdex-production` for
production. Uploaded files are deleted automatically after 30 days.

## Good to know

- **Secrets** live in Secrets Manager, and the encryption keys for cookies and saved tokens in
  Parameter Store. Losing the Parameter Store keys signs everyone out and makes saved Calendly
  tokens unreadable, so don't delete `/pitchdex-<environment>/data-protection`.
- **Only one worker may run.** Its service stops the old container before starting a new one, so
  sending pauses briefly during a deploy.
- **Migrations run while the old version is still up.** Old code briefly runs against the new
  database, so a migration that renames or drops a column can cause errors until the rollout ends.
- **Local development is unchanged.** None of this applies when `ASPNETCORE_ENVIRONMENT` is
  `Development`.
- **Costs** are roughly $120-170 a month for production and $50-70 for test. These are estimates:
  check the AWS bill after the first month.
