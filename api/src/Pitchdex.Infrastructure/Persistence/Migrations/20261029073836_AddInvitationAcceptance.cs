using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationAcceptance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "accepted_at",
                table: "messages",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "accepted_at",
                table: "messages");
        }
    }
}
