using Microsoft.EntityFrameworkCore;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.Tests
{
    public abstract class TestBase : IDisposable
    {
        protected DatabaseContext Context { get; }
        protected IRepository<User> UserRepository { get; }
        protected IRepository<Merchant> MerchantRepository { get; }
        protected IRepository<MerchantInvoice> InvoiceRepository { get; }
        protected IRepository<CreditCard> CardRepository { get; }
        protected IRepository<UserSession> SessionRepository { get; }
        protected IRepository<TransactionHistory> TransactionHistoryRepository { get; }

        protected TestBase()
        {
            var options = new DbContextOptionsBuilder<DatabaseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            Context = new DatabaseContext(options);
            Context.Database.EnsureCreated();

            UserRepository = new Repository<User>(Context);
            MerchantRepository = new Repository<Merchant>(Context);
            InvoiceRepository = new Repository<MerchantInvoice>(Context);
            CardRepository = new Repository<CreditCard>(Context);
            SessionRepository = new Repository<UserSession>(Context);
            TransactionHistoryRepository = new Repository<TransactionHistory>(Context);
        }

        protected User CreateTestUser(string username = "testuser", string password = "TestPassword123!")
        {
            var salt = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
            var hashedPassword = HashPassword(password, salt);

            var user = new User
            {
                Guid = Guid.NewGuid(),
                FirstName = "Test",
                LastName = "User",
                Username = username,
                Password = hashedPassword,
                PasswordSalt = salt
            };

            UserRepository.Add(user);
            Context.SaveChanges();
            return user;
        }

        protected Merchant CreateTestMerchant(Guid userGuid, string code = "LM-1", double balance = 0)
        {
            var merchant = new Merchant
            {
                Guid = Guid.NewGuid(),
                Code = code,
                Name = "Test Merchant",
                Description = "Test Description",
                LogoURL = "",
                Balance = balance,
                OwnerUserGuid = userGuid
            };

            MerchantRepository.Add(merchant);
            Context.SaveChanges();
            return merchant;
        }

        protected MerchantInvoice CreateTestInvoice(Guid merchantGuid, decimal amount = 100, bool isPaid = false, DateTime? dueAt = null)
        {
            var invoice = new MerchantInvoice
            {
                Guid = Guid.NewGuid(),
                Number = $"INV-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}",
                MerchantGuid = merchantGuid,
                Amount = amount,
                Description = "Test Invoice",
                CreatedAt = DateTime.UtcNow,
                DueAt = dueAt ?? DateTime.UtcNow.AddDays(7),
                IsPaid = isPaid,
                PaidBy = isPaid ? "Test Customer" : string.Empty
            };

            InvoiceRepository.Add(invoice);
            Context.SaveChanges();
            return invoice;
        }

        protected CreditCard CreateTestCard(string number = "1234567890123456", double balance = 1000)
        {
            var card = new CreditCard
            {
                Guid = Guid.NewGuid(),
                HolderFirstName = "Test",
                HolderLastName = "Cardholder",
                Number = number,
                ExpirationDate = DateTime.UtcNow.AddYears(2),
                CVV = "123",
                Balance = balance
            };

            CardRepository.Add(card);
            Context.SaveChanges();
            return card;
        }

        private string HashPassword(string password, string salt)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var saltedPassword = password + salt;
                var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        protected void DetachEntity<T>(T entity) where T : class
        {
            if (entity != null)
            {
                Context.Entry(entity).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            }
        }

        public void Dispose()
        {
            Context.Database.EnsureDeleted();
            Context.Dispose();
        }
    }
}

