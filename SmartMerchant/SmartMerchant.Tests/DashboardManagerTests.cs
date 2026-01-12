using SmartMerchant.Application;
using SmartMerchant.Domain;
using Xunit;

namespace SmartMerchant.Tests
{
    public class DashboardManagerTests : TestBase
    {
        private DashboardManager CreateManager()
        {
            return new DashboardManager(Context, MerchantRepository, InvoiceRepository);
        }

        [Fact]
        public void GetDashboardStats_WithNoMerchant_ReturnsEmptyStats()
        {
            // Arrange
            var manager = CreateManager();
            var fakeGuid = Guid.NewGuid();

            // Act
            var result = manager.GetDashboardStats(fakeGuid);

            // Assert
            Assert.Equal(0.0, result.CurrentBalance);
            Assert.Equal(0.0, result.PendingSettlements);
            Assert.Equal(0, result.TodayTransactionsCount);
        }

        [Fact]
        public void GetDashboardStats_CalculatesCurrentBalance()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid, "LM-1", 5000.0);

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            Assert.Equal(5000.0, result.CurrentBalance);
        }

        [Fact]
        public void GetDashboardStats_CalculatesPendingSettlements()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            CreateTestInvoice(merchant.Guid, 1000m, false);
            CreateTestInvoice(merchant.Guid, 2000m, false);
            CreateTestInvoice(merchant.Guid, 500m, true); // Paid, should not count

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            Assert.Equal(3000.0, result.PendingSettlements);
        }

        [Fact]
        public void GetDashboardStats_CalculatesTodayTransactionsCount()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            var today = DateTime.UtcNow.Date;
            var invoice1 = CreateTestInvoice(merchant.Guid, 100m, true);
            invoice1.CreatedAt = today;
            InvoiceRepository.Update(invoice1);
            
            var invoice2 = CreateTestInvoice(merchant.Guid, 200m, true);
            invoice2.CreatedAt = today;
            InvoiceRepository.Update(invoice2);
            
            var invoice3 = CreateTestInvoice(merchant.Guid, 300m, true);
            invoice3.CreatedAt = today.AddDays(-1); // Yesterday
            InvoiceRepository.Update(invoice3);
            
            Context.SaveChanges();

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            Assert.Equal(2, result.TodayTransactionsCount);
        }

        [Fact]
        public void GetDashboardStats_CalculatesSuccessRate()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            CreateTestInvoice(merchant.Guid, 100m, true);  // Paid
            CreateTestInvoice(merchant.Guid, 200m, true);  // Paid
            CreateTestInvoice(merchant.Guid, 300m, false); // Unpaid
            CreateTestInvoice(merchant.Guid, 400m, false); // Unpaid

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            Assert.Equal(50.0, result.SuccessRate); // 2 paid out of 4 total = 50%
        }

        [Fact]
        public void GetDashboardStats_WithNoInvoices_Returns100PercentSuccessRate()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            Assert.Equal(100.0, result.SuccessRate);
        }

        [Fact]
        public void GetDashboardStats_CalculatesBalanceChangePercent()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);
            
            // Today's paid invoices: 1000
            var todayInvoice = CreateTestInvoice(merchant.Guid, 1000m, true);
            todayInvoice.CreatedAt = today;
            InvoiceRepository.Update(todayInvoice);
            
            // Yesterday's paid invoices: 500
            var yesterdayInvoice = CreateTestInvoice(merchant.Guid, 500m, true);
            yesterdayInvoice.CreatedAt = yesterday;
            InvoiceRepository.Update(yesterdayInvoice);
            
            Context.SaveChanges();

            // Act
            var result = manager.GetDashboardStats(merchant.Guid);

            // Assert
            // (1000 - 500) / 500 * 100 = 100%
            Assert.Equal(100.0, result.BalanceChangePercent, 1);
        }

        [Fact]
        public void GetRecentTransactions_ReturnsPaidInvoicesOrderedByDate()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            var invoice1 = CreateTestInvoice(merchant.Guid, 100m, true);
            invoice1.CreatedAt = DateTime.UtcNow.AddDays(-1);
            InvoiceRepository.Update(invoice1);
            
            var invoice2 = CreateTestInvoice(merchant.Guid, 200m, true);
            invoice2.CreatedAt = DateTime.UtcNow;
            InvoiceRepository.Update(invoice2);
            
            var invoice3 = CreateTestInvoice(merchant.Guid, 300m, false); // Unpaid, should not appear
            InvoiceRepository.Update(invoice3);
            
            Context.SaveChanges();

            // Act
            var transactions = manager.GetRecentTransactions(merchant.Guid, 10);

            // Assert
            Assert.Equal(2, transactions.Count);
            Assert.True(transactions[0].Timestamp >= transactions[1].Timestamp);
            Assert.All(transactions, t => Assert.Equal("Success", t.Status));
        }

        [Fact]
        public void GetRecentTransactions_RespectsLimit()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            // Create 15 paid invoices
            for (int i = 0; i < 15; i++)
            {
                var invoice = CreateTestInvoice(merchant.Guid, 100m * (i + 1), true);
                invoice.CreatedAt = DateTime.UtcNow.AddMinutes(-i);
                InvoiceRepository.Update(invoice);
            }
            Context.SaveChanges();

            // Act
            var transactions = manager.GetRecentTransactions(merchant.Guid, 10);

            // Assert
            Assert.Equal(10, transactions.Count);
        }

        [Fact]
        public void GetRecentTransactions_WithNoPaidInvoices_ReturnsEmpty()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            CreateTestInvoice(merchant.Guid, 100m, false);
            CreateTestInvoice(merchant.Guid, 200m, false);

            // Act
            var transactions = manager.GetRecentTransactions(merchant.Guid, 10);

            // Assert
            Assert.Empty(transactions);
        }

        [Fact]
        public void GetRecentTransactions_MapsInvoiceDataCorrectly()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var invoice = CreateTestInvoice(merchant.Guid, 1500m, true);
            invoice.PaidBy = "Test Customer";
            InvoiceRepository.Update(invoice);
            Context.SaveChanges();

            // Act
            var transactions = manager.GetRecentTransactions(merchant.Guid, 10);

            // Assert
            Assert.Single(transactions);
            var transaction = transactions[0];
            Assert.Equal(invoice.Guid, transaction.InvoiceGuid);
            Assert.Equal(invoice.Number, transaction.OrderId);
            Assert.Equal("Test Customer", transaction.Customer);
            Assert.Equal(1500m, transaction.Amount);
            Assert.Equal("Success", transaction.Status);
        }
    }
}

