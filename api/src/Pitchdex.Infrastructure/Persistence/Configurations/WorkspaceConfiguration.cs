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
