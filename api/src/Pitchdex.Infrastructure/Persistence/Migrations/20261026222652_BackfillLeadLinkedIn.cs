using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pitchdex.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Leads saved from Explore before leads had a LinkedIn link get their investor's link,
    /// so they can receive LinkedIn steps.
    /// </summary>
    public partial class BackfillLeadLinkedIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE leads
                SET linkedin_url = investors.linkedin_url
                FROM investors
                WHERE leads.investor_id = investors.id
                  AND leads.linkedin_url IS NULL
                  AND investors.linkedin_url IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data-only change: nothing to undo.
        }
    }
}
