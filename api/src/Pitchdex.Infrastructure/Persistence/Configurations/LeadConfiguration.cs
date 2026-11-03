using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Investors;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).ValueGeneratedNever();

        builder.Property(l => l.FullName).HasMaxLength(200);
        builder.Property(l => l.Email).HasMaxLength(320);
        builder.Property(l => l.Firm).HasMaxLength(200);
        builder.Property(l => l.Status).HasConversion<string>().HasMaxLength(20);

        // Named by hand, since the naming convention would split "LinkedIn" into linked_in.
        builder.Property(l => l.LinkedInUrl).HasColumnName("linkedin_url").HasMaxLength(500);
        builder.Property(l => l.LinkedInProviderId).HasColumnName("linkedin_provider_id").HasMaxLength(200);
        builder.Property(l => l.LinkedInCheckedAt).HasColumnName("linkedin_checked_at");

        builder.OwnsOne(l => l.LinkedIn, profile =>
        {
            profile.Property(p => p.Headline).HasColumnName("linkedin_headline").HasMaxLength(500);
            profile.Property(p => p.Location).HasColumnName("linkedin_location").HasMaxLength(200);
            profile.Property(p => p.PictureUrl).HasColumnName("linkedin_picture_url").HasMaxLength(1000);
            profile.Property(p => p.Degree).HasColumnName("linkedin_degree").HasConversion<string>().HasMaxLength(20);
            profile.Property(p => p.IsOpenProfile).HasColumnName("linkedin_open_profile");
            profile.Property(p => p.IsPremium).HasColumnName("linkedin_premium");
            profile.Property(p => p.FetchedAt).HasColumnName("linkedin_fetched_at");
        });
        builder.Navigation(l => l.LinkedIn).IsRequired(false);

        builder.HasIndex(l => l.UpdatedAt);
        builder.HasIndex(l => l.LinkedInProviderId);

        // A lead saved from Explore points back at its investor. Deleting the investor
        // keeps the lead and just clears the link.
        builder.HasOne<Investor>()
            .WithMany()
            .HasForeignKey(l => l.InvestorId)
            .OnDelete(DeleteBehavior.SetNull);

        // Each investor can be saved once per workspace.
        builder.HasIndex(l => new { l.WorkspaceId, l.InvestorId }).IsUnique();
    }
}
