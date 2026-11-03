using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendlyMeetings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "calendly_connected_at",
                table: "workspaces",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_email",
                table: "workspaces",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_last_error",
                table: "workspaces",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_name",
                table: "workspaces",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "calendly_synced_at",
                table: "workspaces",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_token",
                table: "workspaces",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_url",
                table: "workspaces",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "calendly_user_uri",
                table: "workspaces",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "meetings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    join_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    event_uri = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    invitee_uri = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_meetings", x => x.id);
                    table.ForeignKey(
                        name: "fk_meetings_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_meetings_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_meetings_event_uri",
                table: "meetings",
                column: "event_uri");

            migrationBuilder.CreateIndex(
                name: "ix_meetings_lead_id_starts_at",
                table: "meetings",
                columns: new[] { "lead_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_meetings_workspace_id",
                table: "meetings",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_meetings_workspace_id_invitee_uri",
                table: "meetings",
                columns: new[] { "workspace_id", "invitee_uri" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "meetings");

            migrationBuilder.DropColumn(
                name: "calendly_connected_at",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_email",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_last_error",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_name",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_synced_at",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_token",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_url",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "calendly_user_uri",
                table: "workspaces");
        }
    }
}
