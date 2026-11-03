using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Meetings;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class MeetingConfiguration : IEntityTypeConfiguration<Meeting>
{
    public void Configure(EntityTypeBuilder<Meeting> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.Title).HasMaxLength(300);
        builder.Property(m => m.JoinUrl).HasMaxLength(1000);
        builder.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(m => m.EventUri).HasMaxLength(300);
        builder.Property(m => m.InviteeUri).HasMaxLength(300);
        builder.Property(m => m.InviteeName).HasMaxLength(200);
        builder.Property(m => m.InviteeEmail).HasMaxLength(320);

        // Deleting a lead keeps their calls on the Calendar, no longer linked.
        builder.HasOne<Lead>().WithMany().HasForeignKey(m => m.LeadId).OnDelete(DeleteBehavior.SetNull);

        // A booking is stored once, however many times Calendly is checked.
        builder.HasIndex(m => new { m.WorkspaceId, m.InviteeUri }).IsUnique();
        builder.HasIndex(m => m.EventUri);
        builder.HasIndex(m => new { m.LeadId, m.StartsAt });
    }
}
