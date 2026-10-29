using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSignInAndWorkspaces : Migration
    {
        private static readonly Guid FirstWorkspaceId = new("00000000-0000-0000-0000-000000000001");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_leads_investor_id",
                table: "leads");

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "messages",
                type: "uuid",
                nullable: false,
                defaultValue: FirstWorkspaceId);

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "leads",
                type: "uuid",
                nullable: false,
                defaultValue: FirstWorkspaceId);

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "enrollments",
                type: "uuid",
                nullable: false,
                defaultValue: FirstWorkspaceId);

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "connected_accounts",
                type: "uuid",
                nullable: false,
                defaultValue: FirstWorkspaceId);

            migrationBuilder.AddColumn<Guid>(
                name: "workspace_id",
                table: "campaigns",
                type: "uuid",
                nullable: false,
                defaultValue: FirstWorkspaceId);

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: true),
                    security_stamp = table.Column<string>(type: "text", nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    phone_number_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockout_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    access_failed_count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "workspaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    time_zone_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    send_from_hour = table.Column<int>(type: "integer", nullable: false),
                    send_until_hour = table.Column<int>(type: "integer", nullable: false),
                    weekdays_only = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspaces", x => x.id);
                });

            // Everything made before sign-in goes into one workspace, keeping the working hours
            // already saved. The first person to sign up takes it over (SetUpWorkspaceHandler).
            migrationBuilder.Sql($"""
                INSERT INTO workspaces (id, name, time_zone_id, send_from_hour, send_until_hour, weekdays_only, created_at, updated_at)
                SELECT '{FirstWorkspaceId}', 'My workspace',
                       COALESCE(s.time_zone_id, 'America/New_York'), COALESCE(s.send_from_hour, 9),
                       COALESCE(s.send_until_hour, 17), COALESCE(s.weekdays_only, true), now(), now()
                FROM (SELECT 1) AS one
                LEFT JOIN workspace_settings s ON s.id = 1;
                """);

            migrationBuilder.DropTable(
                name: "workspace_settings");

            migrationBuilder.CreateTable(
                name: "role_claims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_role_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_role_claims_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_claims_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                columns: table => new
                {
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    provider_key = table.Column<string>(type: "text", nullable: false),
                    provider_display_name = table.Column<string>(type: "text", nullable: true),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_logins", x => new { x.login_provider, x.provider_key });
                    table.ForeignKey(
                        name: "fk_user_logins_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_roles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "fk_user_roles_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_user_roles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_tokens", x => new { x.user_id, x.login_provider, x.name });
                    table.ForeignKey(
                        name: "fk_user_tokens_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workspace_members",
                columns: table => new
                {
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspace_members", x => new { x.workspace_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_workspace_members_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_workspace_members_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_messages_workspace_id",
                table: "messages",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_investor_id",
                table: "leads",
                column: "investor_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_workspace_id",
                table: "leads",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_leads_workspace_id_investor_id",
                table: "leads",
                columns: new[] { "workspace_id", "investor_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_workspace_id",
                table: "enrollments",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_connected_accounts_workspace_id",
                table: "connected_accounts",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_campaigns_workspace_id",
                table: "campaigns",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_role_claims_role_id",
                table: "role_claims",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "roles",
                column: "normalized_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_claims_user_id",
                table: "user_claims",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_logins_user_id",
                table: "user_logins",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_user_roles_role_id",
                table: "user_roles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "users",
                column: "normalized_email");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "users",
                column: "normalized_user_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_workspace_members_user_id",
                table: "workspace_members",
                column: "user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_campaigns_workspaces_workspace_id",
                table: "campaigns",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_connected_accounts_workspaces_workspace_id",
                table: "connected_accounts",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_enrollments_workspaces_workspace_id",
                table: "enrollments",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_leads_workspaces_workspace_id",
                table: "leads",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_workspaces_workspace_id",
                table: "messages",
                column: "workspace_id",
                principalTable: "workspaces",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            // The default only moved existing rows into the first workspace. New rows always get
            // their workspace from the app, so the columns have no default from here on.
            foreach (var table in new[] { "messages", "leads", "enrollments", "connected_accounts", "campaigns" })
            {
                migrationBuilder.Sql($"ALTER TABLE {table} ALTER COLUMN workspace_id DROP DEFAULT;");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_campaigns_workspaces_workspace_id",
                table: "campaigns");

            migrationBuilder.DropForeignKey(
                name: "fk_connected_accounts_workspaces_workspace_id",
                table: "connected_accounts");

            migrationBuilder.DropForeignKey(
                name: "fk_enrollments_workspaces_workspace_id",
                table: "enrollments");

            migrationBuilder.DropForeignKey(
                name: "fk_leads_workspaces_workspace_id",
                table: "leads");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_workspaces_workspace_id",
                table: "messages");

            migrationBuilder.DropTable(
                name: "role_claims");

            migrationBuilder.DropTable(
                name: "user_claims");

            migrationBuilder.DropTable(
                name: "user_logins");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropTable(
                name: "user_tokens");

            migrationBuilder.DropTable(
                name: "workspace_members");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "workspaces");

            migrationBuilder.DropIndex(
                name: "ix_messages_workspace_id",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_leads_investor_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_leads_workspace_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_leads_workspace_id_investor_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_enrollments_workspace_id",
                table: "enrollments");

            migrationBuilder.DropIndex(
                name: "ix_connected_accounts_workspace_id",
                table: "connected_accounts");

            migrationBuilder.DropIndex(
                name: "ix_campaigns_workspace_id",
                table: "campaigns");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "connected_accounts");

            migrationBuilder.DropColumn(
                name: "workspace_id",
                table: "campaigns");

            migrationBuilder.CreateTable(
                name: "workspace_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    send_from_hour = table.Column<int>(type: "integer", nullable: false),
                    send_until_hour = table.Column<int>(type: "integer", nullable: false),
                    time_zone_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    weekdays_only = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspace_settings", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_leads_investor_id",
                table: "leads",
                column: "investor_id",
                unique: true);
        }
    }
}
