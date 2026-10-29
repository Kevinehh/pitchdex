using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMessaging : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "linkedin_provider_id",
                table: "leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linkedin_url",
                table: "leads",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "connected_accounts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    external_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    provider_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    address = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    last_synced_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_connected_accounts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: true),
                    kind = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    direction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    external_id = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    thread_id = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    body = table.Column<string>(type: "text", nullable: false),
                    counterpart_identifier = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_connected_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "connected_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_leads_linkedin_provider_id",
                table: "leads",
                column: "linkedin_provider_id");

            migrationBuilder.CreateIndex(
                name: "ix_connected_accounts_external_id",
                table: "connected_accounts",
                column: "external_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_messages_account_id_external_id",
                table: "messages",
                columns: new[] { "account_id", "external_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_messages_lead_id",
                table: "messages",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_sent_at",
                table: "messages",
                column: "sent_at");

            migrationBuilder.CreateIndex(
                name: "ix_messages_thread_id",
                table: "messages",
                column: "thread_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "connected_accounts");

            migrationBuilder.DropIndex(
                name: "ix_leads_linkedin_provider_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_provider_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_url",
                table: "leads");
        }
    }
}
