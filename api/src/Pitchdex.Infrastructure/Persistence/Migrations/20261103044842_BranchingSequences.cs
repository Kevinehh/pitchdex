using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BranchingSequences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_campaign_steps_campaign_id_position",
                table: "campaign_steps");

            migrationBuilder.AddColumn<Guid>(
                name: "next_step_id",
                table: "enrollments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "branch",
                table: "campaign_steps",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "parent_step_id",
                table: "campaign_steps",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "wait_days",
                table: "campaign_steps",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Sequences so far are straight lines: each step follows the one before it, and each
            // lead's next step is the one at the position they were on.
            migrationBuilder.Sql("""
                UPDATE campaign_steps AS s SET parent_step_id = p.id
                FROM campaign_steps AS p
                WHERE p.campaign_id = s.campaign_id AND p.position = s.position - 1;
                """);
            migrationBuilder.Sql("""
                UPDATE enrollments AS e SET next_step_id = s.id
                FROM campaign_steps AS s
                WHERE s.campaign_id = e.campaign_id AND s.position = e.next_step_position;
                """);

            migrationBuilder.DropColumn(
                name: "next_step_position",
                table: "enrollments");

            migrationBuilder.CreateTable(
                name: "profile_views",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    enrollment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    campaign_step_id = table.Column<Guid>(type: "uuid", nullable: true),
                    viewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_profile_views", x => x.id);
                    table.ForeignKey(
                        name: "fk_profile_views_campaign_steps_campaign_step_id",
                        column: x => x.campaign_step_id,
                        principalTable: "campaign_steps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_profile_views_connected_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "connected_accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_profile_views_enrollments_enrollment_id",
                        column: x => x.enrollment_id,
                        principalTable: "enrollments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_profile_views_leads_lead_id",
                        column: x => x.lead_id,
                        principalTable: "leads",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_profile_views_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_enrollments_next_step_id",
                table: "enrollments",
                column: "next_step_id");

            migrationBuilder.CreateIndex(
                name: "ix_campaign_steps_campaign_id_position",
                table: "campaign_steps",
                columns: new[] { "campaign_id", "position" });

            migrationBuilder.CreateIndex(
                name: "ix_campaign_steps_parent_step_id",
                table: "campaign_steps",
                column: "parent_step_id");

            migrationBuilder.CreateIndex(
                name: "ix_profile_views_account_id_viewed_at",
                table: "profile_views",
                columns: new[] { "account_id", "viewed_at" });

            migrationBuilder.CreateIndex(
                name: "ix_profile_views_campaign_step_id",
                table: "profile_views",
                column: "campaign_step_id");

            migrationBuilder.CreateIndex(
                name: "ix_profile_views_enrollment_id",
                table: "profile_views",
                column: "enrollment_id");

            migrationBuilder.CreateIndex(
                name: "ix_profile_views_lead_id",
                table: "profile_views",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "ix_profile_views_workspace_id",
                table: "profile_views",
                column: "workspace_id");

            migrationBuilder.AddForeignKey(
                name: "fk_enrollments_campaign_steps_next_step_id",
                table: "enrollments",
                column: "next_step_id",
                principalTable: "campaign_steps",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Back to positions. Branching sequences don't fit a straight line, so leads on a
            // branch keep only where their next step sits in the editor's order.
            migrationBuilder.AddColumn<int>(
                name: "next_step_position",
                table: "enrollments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE enrollments AS e SET next_step_position = s.position
                FROM campaign_steps AS s
                WHERE s.id = e.next_step_id;
                """);

            migrationBuilder.DropForeignKey(
                name: "fk_enrollments_campaign_steps_next_step_id",
                table: "enrollments");

            migrationBuilder.DropTable(
                name: "profile_views");

            migrationBuilder.DropIndex(
                name: "ix_enrollments_next_step_id",
                table: "enrollments");

            migrationBuilder.DropIndex(
                name: "ix_campaign_steps_campaign_id_position",
                table: "campaign_steps");

            migrationBuilder.DropIndex(
                name: "ix_campaign_steps_parent_step_id",
                table: "campaign_steps");

            migrationBuilder.DropColumn(
                name: "next_step_id",
                table: "enrollments");

            migrationBuilder.DropColumn(
                name: "branch",
                table: "campaign_steps");

            migrationBuilder.DropColumn(
                name: "parent_step_id",
                table: "campaign_steps");

            migrationBuilder.DropColumn(
                name: "wait_days",
                table: "campaign_steps");

            migrationBuilder.CreateIndex(
                name: "ix_campaign_steps_campaign_id_position",
                table: "campaign_steps",
                columns: new[] { "campaign_id", "position" },
                unique: true);
        }
    }
}
