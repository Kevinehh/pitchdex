using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadLinkedInProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "linkedin_checked_at",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linkedin_degree",
                table: "leads",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "linkedin_fetched_at",
                table: "leads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linkedin_headline",
                table: "leads",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linkedin_location",
                table: "leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "linkedin_open_profile",
                table: "leads",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linkedin_picture_url",
                table: "leads",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "linkedin_premium",
                table: "leads",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "linkedin_checked_at",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_degree",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_fetched_at",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_headline",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_location",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_open_profile",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_picture_url",
                table: "leads");

            migrationBuilder.DropColumn(
                name: "linkedin_premium",
                table: "leads");
        }
    }
}
