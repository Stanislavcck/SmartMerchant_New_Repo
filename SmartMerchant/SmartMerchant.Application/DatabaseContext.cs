using Microsoft.EntityFrameworkCore;
using SmartMerchant.Domain;

namespace SmartMerchant.Application
{
    public class DatabaseContext : DbContext
    {
        public DbSet<User> User { get; set; }
        public DbSet<Merchant> Merchant { get; set; }
        public DbSet<MerchantInvoice> MerchantInvoice { get; set; }
        public DbSet<CreditCard> CreditCard { get; set; }
        public DbSet<TransactionHistory> TransactionHistory { get; set; }
        public DbSet<UserSession> UserSession { get; set; }


        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.UseIdentityColumns();
            builder.UseSerialColumns();

            var tables = GetType().GetProperties().Where(p => p.PropertyType.IsGenericType && p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>));
            var tableTypes = tables.Select(t => t.PropertyType.GetGenericArguments().First());

            var entityTypes = tableTypes.Where(t => t.IsSubclassOf(typeof(Entity)));

            foreach (var type in entityTypes)
            {
                if (type.IsSubclassOf(typeof(Entity)))
                {
                    builder.Entity(type).HasKey(nameof(Entity.Guid));
                }
            }

            // Configure foreign keys and indexes for GUID properties
            ConfigureUser(builder);
            ConfigureMerchant(builder);
            ConfigureMerchantInvoice(builder);
            ConfigureTransactionHistory(builder);
            ConfigureUserSession(builder);

            base.OnModelCreating(builder);
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.EnableSensitiveDataLogging();
            base.OnConfiguring(optionsBuilder);
        }

        private void ConfigureUser(ModelBuilder builder)
        {
            builder.Entity<User>(entity =>
            {
                // Unique index on Username
                entity.HasIndex(u => u.Username)
                    .IsUnique();
            });
        }

        private void ConfigureMerchant(ModelBuilder builder)
        {
            builder.Entity<Merchant>(entity =>
            {
                // Foreign key to User
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(m => m.OwnerUserGuid)
                    .OnDelete(DeleteBehavior.Restrict);

                // Unique constraint: User can only have one merchant
                entity.HasIndex(m => m.OwnerUserGuid)
                    .IsUnique();

                // Unique index on Code
                entity.HasIndex(m => m.Code)
                    .IsUnique();
            });
        }

        private void ConfigureMerchantInvoice(ModelBuilder builder)
        {
            builder.Entity<MerchantInvoice>(entity =>
            {
                // Foreign key to Merchant
                entity.HasOne<Merchant>()
                    .WithMany()
                    .HasForeignKey(mi => mi.MerchantGuid)
                    .OnDelete(DeleteBehavior.Restrict);

                // Index on foreign key for performance
                entity.HasIndex(mi => mi.MerchantGuid);

                // Unique index on Number
                entity.HasIndex(mi => mi.Number)
                    .IsUnique();
            });
        }

        private void ConfigureTransactionHistory(ModelBuilder builder)
        {
            builder.Entity<TransactionHistory>(entity =>
            {
                // Foreign key to Merchant
                entity.HasOne<Merchant>()
                    .WithMany()
                    .HasForeignKey(th => th.MerchantGuid)
                    .OnDelete(DeleteBehavior.Restrict);

                // Index on foreign key for performance
                entity.HasIndex(th => th.MerchantGuid);

                // Index on CreatedAt for querying by date
                entity.HasIndex(th => th.CreatedAt);
            });
        }

        private void ConfigureUserSession(ModelBuilder builder)
        {
            builder.Entity<UserSession>(entity =>
            {
                // Foreign key to User
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(us => us.UserGuid)
                    .OnDelete(DeleteBehavior.Cascade);

                // Index on foreign key for performance
                entity.HasIndex(us => us.UserGuid);

                // Unique index on Token
                entity.HasIndex(us => us.Token)
                    .IsUnique();

                // Index on ExpireAt for cleanup queries
                entity.HasIndex(us => us.ExpireAt);
            });
        }
    }
}
