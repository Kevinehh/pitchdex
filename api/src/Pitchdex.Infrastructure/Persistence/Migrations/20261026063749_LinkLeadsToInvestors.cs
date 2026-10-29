using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LinkLeadsToInvestors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "investor_id",
                table: "leads",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_leads_investor_id",
                table: "leads",
                column: "investor_id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_leads_investors_investor_id",
                table: "leads",
                column: "investor_id",
                principalTable: "investors",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_leads_investors_investor_id",
                table: "leads");

            migrationBuilder.DropIndex(
                name: "ix_leads_investor_id",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "investor_id",
                table: "leads");
        }
    }
}
