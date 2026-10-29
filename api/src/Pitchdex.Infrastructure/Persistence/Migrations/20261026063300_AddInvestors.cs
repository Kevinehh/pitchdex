using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvestors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "investors",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    linkedin_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    firm_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    firm_domain = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: true),
                    firm_linkedin_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    firm_industry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    fund_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    investment_role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    stages = table.Column<List<string>>(type: "text[]", nullable: false),
                    industries = table.Column<List<string>>(type: "text[]", nullable: false),
                    geographies = table.Column<List<string>>(type: "text[]", nullable: false),
                    check_size_min = table.Column<long>(type: "bigint", nullable: true),
                    check_size_max = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_investors", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_investors_email",
                table: "investors",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_investors_geographies",
                table: "investors",
                column: "geographies")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_investors_industries",
                table: "investors",
                column: "industries")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_investors_stages",
                table: "investors",
                column: "stages")
                .Annotation("Npgsql:IndexMethod", "gin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "investors");
        }
    }
}
