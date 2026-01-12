using SmartMerchant.Application;
using SmartMerchant.Domain;
using Xunit;

namespace SmartMerchant.Tests
{
    public class MerchantManagerTests : TestBase
    {
        private MerchantManager CreateManager()
        {
            return new MerchantManager(Context, MerchantRepository);
        }

        [Fact]
        public void Create_WithValidData_ReturnsSuccess()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();

            // Act
            var result = manager.Create(user.Guid, "Test Merchant", "Description", "logo.png");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.MerchantGuid);
            var merchant = MerchantRepository.GetById(result.MerchantGuid.Value);
            Assert.NotNull(merchant);
            Assert.Equal("LM-1", merchant.Code);
            Assert.Equal(0.0, merchant.Balance);
        }

        [Fact]
        public void Create_WithExistingMerchant_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            CreateTestMerchant(user.Guid);

            // Act
            var result = manager.Create(user.Guid, "Another Merchant", "Description", "logo.png");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("User already has a merchant. Each user can only have one merchant.", result.Message);
        }

        [Fact]
        public void Create_GeneratesSequentialCodes()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");

            // Act
            var result1 = manager.Create(user1.Guid, "Merchant 1", "Desc", "");
            var result2 = manager.Create(user2.Guid, "Merchant 2", "Desc", "");

            // Assert
            Assert.True(result1.Success);
            Assert.True(result2.Success);
            var merchant1 = MerchantRepository.GetById(result1.MerchantGuid!.Value);
            var merchant2 = MerchantRepository.GetById(result2.MerchantGuid!.Value);
            Assert.Equal("LM-1", merchant1!.Code);
            Assert.Equal("LM-2", merchant2!.Code);
        }

        [Fact]
        public void Edit_WithValidOwnership_UpdatesMerchant()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.Edit(merchant.Guid, user.Guid, null, "Updated Name", "Updated Desc", "newlogo.png");

            // Assert
            Assert.True(result.Success);
            var updated = MerchantRepository.GetById(merchant.Guid);
            Assert.Equal("Updated Name", updated!.Name);
            Assert.Equal("Updated Desc", updated.Description);
            Assert.Equal("newlogo.png", updated.LogoURL);
        }

        [Fact]
        public void Edit_WithInvalidOwnership_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");
            var merchant = CreateTestMerchant(user1.Guid);

            // Act
            var result = manager.Edit(merchant.Guid, user2.Guid, null, "Hacked Name", null, null);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("You do not have permission to edit this merchant", result.Message);
        }

        [Fact]
        public void Edit_WithDuplicateCode_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");
            var merchant1 = CreateTestMerchant(user1.Guid, "LM-1");
            var merchant2 = CreateTestMerchant(user2.Guid, "LM-2");

            // Act
            var result = manager.Edit(merchant1.Guid, user1.Guid, "LM-2", null, null, null);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Merchant code already exists", result.Message);
        }

        [Fact]
        public void AddBalance_WithValidAmount_AddsBalanceWithFee()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid, "LM-1", 100.0);

            // Act
            var result = manager.AddBalance(merchant.Guid, 1000.0);

            // Assert
            Assert.True(result.Success);
            var updated = MerchantRepository.GetById(merchant.Guid);
            var expectedBalance = 100.0 + (1000.0 * ((100 - 3.99) / 100));
            Assert.Equal(expectedBalance, result.NewBalance);
            Assert.Equal(expectedBalance, updated!.Balance, 2);
        }

        [Fact]
        public void AddBalance_WithZeroAmount_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.AddBalance(merchant.Guid, 0);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Amount must be greater than zero", result.Message);
        }

        [Fact]
        public void AddBalance_WithNegativeAmount_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.AddBalance(merchant.Guid, -100);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Amount must be greater than zero", result.Message);
        }

        [Fact]
        public void GetByUserGuid_WithExistingMerchant_ReturnsMerchant()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var merchant = CreateTestMerchant(user.Guid);

            // Act
            var result = manager.GetByUserGuid(user.Guid);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(merchant.Guid, result.Guid);
        }

        [Fact]
        public void GetByUserGuid_WithNoMerchant_ReturnsNull()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();

            // Act
            var result = manager.GetByUserGuid(user.Guid);

            // Assert
            Assert.Null(result);
        }
    }
}

