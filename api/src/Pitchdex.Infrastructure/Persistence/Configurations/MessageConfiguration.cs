using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Messages;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();

        builder.Property(m => m.Kind).HasConversion<string>().HasMaxLength(30);
        builder.Property(m => m.Direction).HasConversion<string>().HasMaxLength(20);
        builder.Property(m => m.ExternalId).HasMaxLength(300);
        builder.Property(m => m.ThreadId).HasMaxLength(300);
        builder.Property(m => m.Subject).HasMaxLength(500);
        builder.Property(m => m.CounterpartIdentifier).HasMaxLength(320);

        builder.HasOne<ConnectedAccount>()
            .WithMany()
            .HasForeignKey(m => m.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        // Deleting a lead keeps the conversation history, just unlinked.
        builder.HasOne<Lead>()
            .WithMany()
            .HasForeignKey(m => m.LeadId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Enrollment>().WithMany().HasForeignKey(m => m.EnrollmentId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<CampaignStep>().WithMany().HasForeignKey(m => m.CampaignStepId).OnDelete(DeleteBehavior.SetNull);

        // A campaign step is sent to each enrollment at most once, even if a send is retried.
        builder.HasIndex(m => new { m.EnrollmentId, m.CampaignStepId }).IsUnique();

        // The same provider message is never stored twice for one account.
        builder.HasIndex(m => new { m.AccountId, m.ExternalId }).IsUnique();

        builder.HasIndex(m => m.SentAt);
        builder.HasIndex(m => m.ThreadId);

        // Unread counts per conversation.
        builder.HasIndex(m => new { m.LeadId, m.Direction, m.ReadAt });
    }
}
