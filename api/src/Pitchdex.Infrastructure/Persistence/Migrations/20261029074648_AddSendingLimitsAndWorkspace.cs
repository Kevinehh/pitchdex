using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSendingLimitsAndWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing accounts keep the limits they had (30 emails, 15 invitations, 40 messages) rather than 0, which would stop them sending.
            migrationBuilder.AddColumn<int>(
                name: "daily_email_limit",
                table: "connected_accounts",
                type: "integer",
                nullable: false,
                defaultValue: 30);

            migrationBuilder.AddColumn<int>(
                name: "daily_invitation_limit",
                table: "connected_accounts",
                type: "integer",
                nullable: false,
                defaultValue: 15);

            migrationBuilder.AddColumn<int>(
                name: "daily_message_limit",
                table: "connected_accounts",
                type: "integer",
                nullable: false,
                defaultValue: 40);

            migrationBuilder.CreateTable(
                name: "workspace_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    time_zone_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    send_from_hour = table.Column<int>(type: "integer", nullable: false),
                    send_until_hour = table.Column<int>(type: "integer", nullable: false),
                    weekdays_only = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspace_settings", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "workspace_settings");

            migrationBuilder.DropColumn(
                name: "daily_email_limit",
                table: "connected_accounts");

            migrationBuilder.DropColumn(
                name: "daily_invitation_limit",
                table: "connected_accounts");

            migrationBuilder.DropColumn(
                name: "daily_message_limit",
                table: "connected_accounts");
        }
    }
}
