using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Pitchdex.Application.Common;
using Pitchdex.Domain.Accounts;
using Pitchdex.Domain.Campaigns;
using Pitchdex.Domain.Common;
using Pitchdex.Domain.Investors;
using Pitchdex.Domain.Leads;
using Pitchdex.Domain.Meetings;
using Pitchdex.Domain.Messages;
using Pitchdex.Domain.Workspaces;
using Pitchdex.Infrastructure.Identity;

namespace Pitchdex.Infrastructure.Persistence;

/// <summary>
/// The database, including Identity's tables for users and sign-in. Every workspace-owned
/// table is filtered to the current workspace on every query, and new rows are stamped
/// with it, so one founder's data can never show up for another.
/// </summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options, WorkspaceContext workspace)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options), IAppDbContext
{
    public DbSet<Campaign> Campaigns => Set<Campaign>();

    public DbSet<CampaignStep> CampaignSteps => Set<CampaignStep>();

    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<ConnectedAccount> ConnectedAccounts => Set<ConnectedAccount>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<Investor> Investors => Set<Investor>();

    public DbSet<Lead> Leads => Set<Lead>();

    public DbSet<Meeting> Meetings => Set<Meeting>();

    public DbSet<ProfileView> ProfileViews => Set<ProfileView>();

    public DbSet<Workspace> Workspaces => Set<Workspace>();

    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();

    /// <summary>
    /// Read by the query filters each time a query runs. With no workspace set it matches
    /// nothing, so a missing workspace shows no data rather than everyone's.
    /// </summary>
    private Guid CurrentWorkspaceId => workspace.Id ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        NameIdentityTables(modelBuilder);

        var owned = modelBuilder.Model.GetEntityTypes()
            .Where(type => typeof(IWorkspaceOwned).IsAssignableFrom(type.ClrType))
            .ToList();

        foreach (var type in owned)
        {
            var entity = modelBuilder.Entity(type.ClrType);
            entity.HasOne(typeof(Workspace)).WithMany().HasForeignKey(nameof(IWorkspaceOwned.WorkspaceId)).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(nameof(IWorkspaceOwned.WorkspaceId));
            entity.HasQueryFilter(WorkspaceFilter(type.ClrType));
        }
    }

    /// <summary>e => e.WorkspaceId == CurrentWorkspaceId, for one entity type.</summary>
    private LambdaExpression WorkspaceFilter(Type entityType)
    {
        var entity = Expression.Parameter(entityType, "e");
        var current = Expression.Property(Expression.Constant(this), nameof(CurrentWorkspaceId));
        return Expression.Lambda(Expression.Equal(Expression.Property(entity, nameof(IWorkspaceOwned.WorkspaceId)), current), entity);
    }

    /// <summary>Plain names instead of Identity's AspNetUsers and friends.</summary>
    private static void NameIdentityTables(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(user =>
        {
            user.ToTable("users");
            user.Property(u => u.FirstName).HasMaxLength(100);
            user.Property(u => u.LastName).HasMaxLength(100);
            user.Property(u => u.SeenTips).HasDefaultValueSql("'{}'");
        });
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        foreach (var entry in ChangeTracker.Entries<IHasTimestamps>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AppUser>().Where(e => e.State == EntityState.Added))
        {
            entry.Entity.CreatedAt = now;
        }

        // New rows join the current workspace, unless the code set one itself (webhooks, workers).
        foreach (var entry in ChangeTracker.Entries<IWorkspaceOwned>().Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.WorkspaceId == Guid.Empty)
            {
                entry.Entity.WorkspaceId = workspace.Id
                    ?? throw new InvalidOperationException($"A {entry.Entity.GetType().Name} can't be saved without a workspace.");
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
