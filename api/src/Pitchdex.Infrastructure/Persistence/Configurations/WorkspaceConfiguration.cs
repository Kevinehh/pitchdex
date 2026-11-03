using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Workspaces;
using Pitchdex.Infrastructure.Identity;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).ValueGeneratedNever();
        builder.Property(w => w.Name).HasMaxLength(200);
        builder.Property(w => w.TimeZoneId).HasMaxLength(100);
        builder.Property(w => w.CalendlyUrl).HasMaxLength(500);

        // Columns on the workspace row rather than a table of their own: one account each.
        builder.OwnsOne(w => w.Calendly, calendly =>
        {
            calendly.Property(c => c.UserUri).HasColumnName("calendly_user_uri").HasMaxLength(300);
            calendly.Property(c => c.Name).HasColumnName("calendly_name").HasMaxLength(200);
            calendly.Property(c => c.Email).HasColumnName("calendly_email").HasMaxLength(320);
            calendly.Property(c => c.ProtectedToken).HasColumnName("calendly_token");
            calendly.Property(c => c.ConnectedAt).HasColumnName("calendly_connected_at");
            calendly.Property(c => c.SyncedAt).HasColumnName("calendly_synced_at");
            calendly.Property(c => c.LastError).HasColumnName("calendly_last_error").HasMaxLength(500);
        });
        builder.Navigation(w => w.Calendly).IsRequired(false);
    }
}

internal sealed class WorkspaceMemberConfiguration : IEntityTypeConfiguration<WorkspaceMember>
{
    public void Configure(EntityTypeBuilder<WorkspaceMember> builder)
    {
        builder.HasKey(m => new { m.WorkspaceId, m.UserId });
        builder.Property(m => m.Role).HasConversion<string>().HasMaxLength(20);

        builder.HasOne<Workspace>().WithMany().HasForeignKey(m => m.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.UserId);
    }
}
