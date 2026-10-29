using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Investors;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class InvestorConfiguration : IEntityTypeConfiguration<Investor>
{
    public void Configure(EntityTypeBuilder<Investor> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();

        builder.Property(i => i.FullName).HasMaxLength(200);
        builder.Property(i => i.FirstName).HasMaxLength(100);
        builder.Property(i => i.LastName).HasMaxLength(100);
        builder.Property(i => i.Email).HasMaxLength(320);
        builder.Property(i => i.Title).HasMaxLength(200);
        // Named by hand, since the naming convention would split "LinkedIn" into linked_in.
        builder.Property(i => i.LinkedInUrl).HasColumnName("linkedin_url").HasMaxLength(500);
        builder.Property(i => i.Location).HasMaxLength(200);
        builder.Property(i => i.City).HasMaxLength(100);
        builder.Property(i => i.Region).HasMaxLength(100);
        builder.Property(i => i.Country).HasMaxLength(100);
        builder.Property(i => i.FirmName).HasMaxLength(200);
        builder.Property(i => i.FirmDomain).HasMaxLength(253);
        builder.Property(i => i.FirmLinkedInUrl).HasColumnName("firm_linkedin_url").HasMaxLength(500);
        builder.Property(i => i.FirmIndustry).HasMaxLength(100);
        builder.Property(i => i.FundType).HasMaxLength(50);
        builder.Property(i => i.InvestmentRole).HasMaxLength(20);

        // One row per person. Imports match on email to update instead of duplicating.
        builder.HasIndex(i => i.Email).IsUnique();

        // Explore filters by these lists, such as "investors who do Seed in Climate".
        // GIN indexes make "list contains value" lookups fast.
        builder.HasIndex(i => i.Stages).HasMethod("gin");
        builder.HasIndex(i => i.Industries).HasMethod("gin");
        builder.HasIndex(i => i.Geographies).HasMethod("gin");
    }
}
