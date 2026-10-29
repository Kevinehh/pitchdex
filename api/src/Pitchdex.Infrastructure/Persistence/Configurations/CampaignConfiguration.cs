using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Name).HasMaxLength(200);
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.TimeZoneId).HasMaxLength(100);

        // Disconnecting an account leaves the campaign in place, just without a sender.
        builder.HasOne<ConnectedAccount>().WithMany().HasForeignKey(c => c.EmailAccountId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<ConnectedAccount>().WithMany().HasForeignKey(c => c.LinkedInAccountId).OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Steps).WithOne().HasForeignKey(s => s.CampaignId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CampaignStepConfiguration : IEntityTypeConfiguration<CampaignStep>
{
    public void Configure(EntityTypeBuilder<CampaignStep> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.Subject).HasMaxLength(300);
        builder.HasIndex(s => new { s.CampaignId, s.Position }).IsUnique();
    }
}

internal sealed class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(e => e.LastError).HasMaxLength(500);

        builder.HasOne<Campaign>().WithMany().HasForeignKey(e => e.CampaignId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Lead>().WithMany().HasForeignKey(e => e.LeadId).OnDelete(DeleteBehavior.Cascade);

        // A lead is enrolled in a campaign once.
        builder.HasIndex(e => new { e.CampaignId, e.LeadId }).IsUnique();

        // The engine's question every minute: which active enrollments are due?
        builder.HasIndex(e => new { e.Status, e.NextRunAt });
    }
}
