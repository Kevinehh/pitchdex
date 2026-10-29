using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "campaign_step_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "enrollment_id",
                table: "messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "campaigns",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    email_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    linked_in_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    time_zone_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    send_from_hour = table.Column<int>(type: "integer", nullable: false),
                    send_until_hour = table.Column<int>(type: "integer", nullable: false),
                    weekdays_only = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_campaigns", x => x.id);
                    table.ForeignKey(
                        name: "fk_campaigns_connected_accounts_email_account_id",
                        column: x => x.email_account_id,
                        principalTable: "connected_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_campaigns_connected_accounts_linked_in_account_id",
                        column: x => x.linked_in_account_id,
                        principalTable: "connected_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "campaign_steps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    campaign_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    delay_days = table.Column<int>(type: "integer", nullable: false),
                    subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    body = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_campaign_steps", x => x.id);
                    table.ForeignKey(
                        name: "fk_campaign_steps_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "enrollments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    campaign_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    next_step_position = table.Column<int>(type: "integer", nullable: false),
                    next_run_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    attempts = table.Column<int>(type: "integer", nullable: false),
                    last_error = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "fk_enrollments_campaigns_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_enrollments_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_messages_campaign_step_id",
                table: "messages",
                column: "campaign_step_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_enrollment_id_campaign_step_id",
                table: "messages",
                columns: new[] { "enrollment_id", "campaign_step_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_campaign_steps_campaign_id_position",
                table: "campaign_steps",
                columns: new[] { "campaign_id", "position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_campaigns_email_account_id",
                table: "campaigns",
                column: "email_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_campaigns_linked_in_account_id",
                table: "campaigns",
                column: "linked_in_account_id");

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_campaign_id_lead_id",
                table: "enrollments",
                columns: new[] { "campaign_id", "lead_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_lead_id",
                table: "enrollments",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_status_next_run_at",
                table: "enrollments",
                columns: new[] { "status", "next_run_at" });

            migrationBuilder.AddForeignKey(
                name: "fk_messages_campaign_steps_campaign_step_id",
                table: "messages",
                column: "campaign_step_id",
                principalTable: "campaign_steps",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_messages_enrollments_enrollment_id",
                table: "messages",
                column: "enrollment_id",
                principalTable: "enrollments",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_messages_campaign_steps_campaign_step_id",
                table: "messages");

            migrationBuilder.DropForeignKey(
                name: "fk_messages_enrollments_enrollment_id",
                table: "messages");

            migrationBuilder.DropTable(
                name: "campaign_steps");

            migrationBuilder.DropTable(
                name: "enrollments");

            migrationBuilder.DropTable(
                name: "campaigns");

            migrationBuilder.DropIndex(
                name: "ix_messages_campaign_step_id",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_messages_enrollment_id_campaign_step_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "campaign_step_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "enrollment_id",
                table: "messages");
        }
    }
}
