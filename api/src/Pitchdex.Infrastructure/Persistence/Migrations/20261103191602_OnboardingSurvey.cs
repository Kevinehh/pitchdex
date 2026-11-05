using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OnboardingSurvey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "heard_from",
                table: "workspaces",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "industries",
                table: "workspaces",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<List<string>>(
                name: "investor_geographies",
                table: "workspaces",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "onboarded_at",
                table: "workspaces",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "raise_size",
                table: "workspaces",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "raise_stage",
                table: "workspaces",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "heard_from",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "industries",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "investor_geographies",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "onboarded_at",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "raise_size",
                table: "workspaces");

            migrationBuilder.DropColumn(
                name: "raise_stage",
                table: "workspaces");
        }
    }
}
