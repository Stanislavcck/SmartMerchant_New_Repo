using SmartMerchant.Application;
using SmartMerchant.Domain;
using Xunit;

namespace SmartMerchant.Tests
{
    public class InvoiceManagerTests : TestBase
    {
        private InvoiceManager CreateManager()
        {
            return new InvoiceManager(Context, InvoiceRepository);
        }

        [Fact]
        public void Create_WithValidData_ReturnsSuccess()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.Create(merchant.Guid, 1000.0m, "Test Invoice", null);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.InvoiceGuid);
            Assert.NotNull(result.InvoiceNumber);
            Assert.StartsWith("INV-", result.InvoiceNumber);
            var invoice = InvoiceRepository.GetById(result.InvoiceGuid.Value);
            Assert.NotNull(invoice);
            Assert.Equal(1000.0m, invoice.Amount);
            Assert.False(invoice.IsPaid);
        }

        [Fact]
        public void Create_GeneratesSequentialNumbers()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result1 = manager.Create(merchant.Guid, 100m, "Invoice 1", null);
            var result2 = manager.Create(merchant.Guid, 200m, "Invoice 2", null);

            // Assert
            Assert.True(result1.Success);
            Assert.True(result2.Success);
            Assert.NotEqual(result1.InvoiceNumber, result2.InvoiceNumber);
        }

        [Fact]
        public void Create_WithCustomDueDate_UsesProvidedDate()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var customDueDate = DateTime.UtcNow.AddDays(30);

            // Act
            var result = manager.Create(merchant.Guid, 500m, "Invoice", customDueDate);

            // Assert
            Assert.True(result.Success);
            var invoice = InvoiceRepository.GetById(result.InvoiceGuid!.Value);
            Assert.Equal(customDueDate.Date, invoice!.DueAt.Date);
        }

        [Fact]
        public void Delete_WithValidOwnership_DeletesInvoice()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var invoice = CreateTestInvoice(merchant.Guid);

            // Act
            var result = manager.Delete(invoice.Guid, merchant.Guid);

            // Assert
            Assert.True(result.Success);
            var deleted = InvoiceRepository.GetById(invoice.Guid);
            Assert.Null(deleted);
        }

        [Fact]
        public void Delete_WithInvalidOwnership_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");
            var merchant1 = CreateTestMerchant(user1.Guid);
            var merchant2 = CreateTestMerchant(user2.Guid);
            var invoice = CreateTestInvoice(merchant1.Guid);

            // Act
            var result = manager.Delete(invoice.Guid, merchant2.Guid);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("You do not have permission to delete this invoice", result.Message);
        }

        [Fact]
        public void Delete_WithNonExistentInvoice_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var fakeGuid = Guid.NewGuid();

            // Act
            var result = manager.Delete(fakeGuid, merchant.Guid);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Invoice not found", result.Message);
        }

        [Fact]
        public void MarkAsPaid_WithValidOwnership_MarksInvoicePaid()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var invoice = CreateTestInvoice(merchant.Guid, 1000m, false);

            // Act
            var result = manager.MarkAsPaid(invoice.Guid, merchant.Guid, "Customer Name");

            // Assert
            Assert.True(result.Success);
            var updated = InvoiceRepository.GetById(invoice.Guid);
            Assert.True(updated!.IsPaid);
            Assert.Equal("Customer Name", updated.PaidBy);
        }

        [Fact]
        public void MarkAsPaid_WithInvalidOwnership_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");
            var merchant1 = CreateTestMerchant(user1.Guid);
            var merchant2 = CreateTestMerchant(user2.Guid);
            var invoice = CreateTestInvoice(merchant1.Guid);

            // Act
            var result = manager.MarkAsPaid(invoice.Guid, merchant2.Guid, "Customer");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("You do not have permission to modify this invoice", result.Message);
        }

        [Fact]
        public void GetByMerchantGuid_WithPagination_ReturnsCorrectPage()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            // Create 15 invoices
            for (int i = 0; i < 15; i++)
            {
                CreateTestInvoice(merchant.Guid, 100m * (i + 1));
            }

            // Act
            var (invoices, totalCount) = manager.GetByMerchantGuid(merchant.Guid, page: 1, pageSize: 10);

            // Assert
            Assert.Equal(15, totalCount);
            Assert.Equal(10, invoices.Count);
        }

        [Fact]
        public void GetByMerchantGuid_WithSecondPage_ReturnsCorrectInvoices()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            
            // Create 15 invoices
            for (int i = 0; i < 15; i++)
            {
                CreateTestInvoice(merchant.Guid, 100m * (i + 1));
            }

            // Act
            var (page1, total1) = manager.GetByMerchantGuid(merchant.Guid, page: 1, pageSize: 10);
            var (page2, total2) = manager.GetByMerchantGuid(merchant.Guid, page: 2, pageSize: 10);

            // Assert
            Assert.Equal(15, total1);
            Assert.Equal(15, total2);
            Assert.Equal(10, page1.Count);
            Assert.Equal(5, page2.Count);
            // Verify no overlap
            Assert.Empty(page1.Select(i => i.Guid).Intersect(page2.Select(i => i.Guid)));
        }

        [Fact]
        public void GetByNumber_WithExistingNumber_ReturnsInvoice()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);
            var invoice = CreateTestInvoice(merchant.Guid);

            // Act
            var result = manager.GetByNumber(invoice.Number);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(invoice.Guid, result.Guid);
        }

        [Fact]
        public void GetByNumber_WithNonExistentNumber_ReturnsNull()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.GetByNumber("INV-999999");

            // Assert
            Assert.Null(result);
        }
    }
}

