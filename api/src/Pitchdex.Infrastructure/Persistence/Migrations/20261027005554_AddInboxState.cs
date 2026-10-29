using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_messages_lead_id",
                table: "messages");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "read_at",
                table: "messages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "archived_at",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_starred",
                table: "leads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_messages_lead_id_direction_read_at",
                table: "messages",
                columns: new[] { "lead_id", "direction", "read_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_messages_lead_id_direction_read_at",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "read_at",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "archived_at",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "is_starred",
                table: "leads");

            migrationBuilder.CreateIndex(
                name: "ix_messages_lead_id",
                table: "messages",
                column: "lead_id");
        }
    }
}
