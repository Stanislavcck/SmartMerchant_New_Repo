using Microsoft.EntityFrameworkCore;
using SmartMerchant.Domain;
using System.Security.Cryptography;
using System.Text;

namespace SmartMerchant.Application
{
    public static class DatabaseSeeder
    {
        public static void Seed(DatabaseContext context)
        {
            // Check if any merchants exist
            if (context.Merchant.Any())
            {
                return; // Database already seeded
            }

            var userRepository = new Repository<User>(context);
            var merchantRepository = new Repository<Merchant>(context);
            var invoiceRepository = new Repository<MerchantInvoice>(context);
            var cardRepository = new Repository<CreditCard>(context);

            // Create empty merchant with user
            var emptyUserGuid = Guid.NewGuid();
            var emptySalt = GenerateSalt();
            var emptyUser = new User
            {
                Guid = emptyUserGuid,
                FirstName = "Empty",
                LastName = "Merchant",
                Username = "empty_merchant",
                Password = HashPassword("12345678", emptySalt),
                PasswordSalt = emptySalt
            };
            userRepository.Add(emptyUser);

            var emptyMerchantGuid = Guid.NewGuid();
            var emptyMerchant = new Merchant
            {
                Guid = emptyMerchantGuid,
                Code = "LM-1",
                Name = "Empty Merchant",
                Description = "An empty merchant for testing",
                LogoURL = "",
                Balance = 0.0,
                OwnerUserGuid = emptyUserGuid
            };
            merchantRepository.Add(emptyMerchant);

            // Create LIME LIME user with merchant and invoices
            var limeUserGuid = Guid.NewGuid();
            var limeSalt = GenerateSalt();
            var limeUser = new User
            {
                Guid = limeUserGuid,
                FirstName = "LIME",
                LastName = "LIME",
                Username = "LIME",
                Password = HashPassword("LIME", limeSalt),
                PasswordSalt = limeSalt
            };
            userRepository.Add(limeUser);

            var limeMerchantGuid = Guid.NewGuid();
            var limeMerchant = new Merchant
            {
                Guid = limeMerchantGuid,
                Code = "LM-2",
                Name = "LIME Merchant",
                Description = "Merchant with invoices",
                LogoURL = "",
                Balance = 10000.0, // 10k balance
                OwnerUserGuid = limeUserGuid
            };
            merchantRepository.Add(limeMerchant);

            // Create 10 invoices: 5 paid, 3 expired, 2 valid unpaid
            var now = DateTime.UtcNow;
            var invoiceCount = 0;

            // 5 paid invoices (due in future, but paid)
            for (int i = 0; i < 5; i++)
            {
                invoiceCount++;
                var invoice = new MerchantInvoice
                {
                    Guid = Guid.NewGuid(),
                    Number = $"INV-{invoiceCount:D6}",
                    MerchantGuid = limeMerchantGuid,
                    Amount = 1000 + (i * 100),
                    Description = $"Paid invoice #{i + 1}",
                    CreatedAt = now.AddDays(-(i + 1)),
                    DueAt = now.AddDays(30 - i), // Future date
                    IsPaid = true,
                    PaidBy = "LIME LIME"
                };
                invoiceRepository.Add(invoice);
            }

            // 3 expired invoices (due in past, not paid)
            for (int i = 0; i < 3; i++)
            {
                invoiceCount++;
                var invoice = new MerchantInvoice
                {
                    Guid = Guid.NewGuid(),
                    Number = $"INV-{invoiceCount:D6}",
                    MerchantGuid = limeMerchantGuid,
                    Amount = 500 + (i * 50),
                    Description = $"Expired invoice #{i + 1}",
                    CreatedAt = now.AddDays(-(i + 10)),
                    DueAt = now.AddDays(-(i + 1)), // Past date
                    IsPaid = false,
                    PaidBy = string.Empty
                };
                invoiceRepository.Add(invoice);
            }

            // 2 valid unpaid invoices (due in future, not paid)
            for (int i = 0; i < 2; i++)
            {
                invoiceCount++;
                var invoice = new MerchantInvoice
                {
                    Guid = Guid.NewGuid(),
                    Number = $"INV-{invoiceCount:D6}",
                    MerchantGuid = limeMerchantGuid,
                    Amount = 750 + (i * 100),
                    Description = $"Valid unpaid invoice #{i + 1}",
                    CreatedAt = now.AddDays(-(i + 1)),
                    DueAt = now.AddDays(7 + i), // Future date
                    IsPaid = false,
                    PaidBy = string.Empty
                };
                invoiceRepository.Add(invoice);
            }

            // Create cards
            // Card 1: 1kk (1,000,000), LIME LIME, 1234 1234 1234 1234, CVV 123
            var card1 = new CreditCard
            {
                Guid = Guid.NewGuid(),
                HolderFirstName = "LIME",
                HolderLastName = "LIME",
                Number = "1234123412341234",
                ExpirationDate = now.AddYears(2),
                CVV = "123",
                Balance = 1000000.0 // 1kk
            };
            cardRepository.Add(card1);

            // Card 2: 100 UAH, BROKE BROKE, 1234 1234 1234 1234, CVV 123
            var card2 = new CreditCard
            {
                Guid = Guid.NewGuid(),
                HolderFirstName = "BROKE",
                HolderLastName = "BROKE",
                Number = "1234123412341234", // Same number format as card1 (as requested)
                ExpirationDate = now.AddYears(2),
                CVV = "123",
                Balance = 100.0
            };
            cardRepository.Add(card2);

            // Card 3: 10k UAH, generic name/number/cvv/exp
            var card3 = new CreditCard
            {
                Guid = Guid.NewGuid(),
                HolderFirstName = "John",
                HolderLastName = "Doe",
                Number = "4111111111111111", // Generic test card number
                ExpirationDate = now.AddYears(1),
                CVV = "456",
                Balance = 10000.0
            };
            cardRepository.Add(card3);

            context.SaveChanges();
        }

        private static string GenerateSalt()
        {
            var saltBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(saltBytes);
            }
            return Convert.ToBase64String(saltBytes);
        }

        private static string HashPassword(string password, string salt)
        {
            using (var sha256 = SHA256.Create())
            {
                var saltedPassword = password + salt;
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}

