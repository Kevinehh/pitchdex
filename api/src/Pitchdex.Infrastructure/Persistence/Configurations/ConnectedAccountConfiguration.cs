using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pitchdex.Domain.Accounts;

namespace Pitchdex.Infrastructure.Persistence.Configurations;

internal sealed class ConnectedAccountConfiguration : IEntityTypeConfiguration<ConnectedAccount>
{
    public void Configure(EntityTypeBuilder<ConnectedAccount> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();

        builder.Property(a => a.ExternalId).HasMaxLength(200);
        builder.Property(a => a.ProviderType).HasMaxLength(50);
        builder.Property(a => a.DisplayName).HasMaxLength(200);
        builder.Property(a => a.Address).HasMaxLength(320);
        builder.Property(a => a.Channel).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(a => a.ExternalId).IsUnique();
    }
}
