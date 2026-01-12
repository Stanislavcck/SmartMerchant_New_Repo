using SmartMerchant.Application;
using SmartMerchant.Domain;
using Xunit;

namespace SmartMerchant.Tests
{
    public class CardManagerTests : TestBase
    {
        private CardManager CreateManager()
        {
            return new CardManager(Context, CardRepository);
        }

        [Fact]
        public void Create_WithValidData_ReturnsSuccess()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Create("John", "Doe", "1234567890123456", DateTime.UtcNow.AddYears(2), "123", 1000.0);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.CardGuid);
            var card = CardRepository.GetById(result.CardGuid.Value);
            Assert.NotNull(card);
            Assert.Equal("John", card.HolderFirstName);
            Assert.Equal("Doe", card.HolderLastName);
            Assert.Equal("1234567890123456", card.Number);
            Assert.Equal(1000.0, card.Balance);
        }

        [Fact]
        public void Create_WithMissingFirstName_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Create("", "Doe", "1234567890123456", DateTime.UtcNow.AddYears(2), "123", 1000.0);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Holder first name and last name are required", result.Message);
        }

        [Fact]
        public void Create_WithShortCardNumber_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Create("John", "Doe", "123456789012", DateTime.UtcNow.AddYears(2), "123", 1000.0);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Valid card number is required", result.Message);
        }

        [Fact]
        public void Create_WithShortCVV_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Create("John", "Doe", "1234567890123456", DateTime.UtcNow.AddYears(2), "12", 1000.0);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Valid CVV is required", result.Message);
        }

        [Fact]
        public void Create_WithDuplicateCardNumber_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            CreateTestCard("1234567890123456");

            // Act
            var result = manager.Create("John", "Doe", "1234567890123456", DateTime.UtcNow.AddYears(2), "123", 1000.0);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Card with this number already exists", result.Message);
        }

        [Fact]
        public void Update_WithValidData_UpdatesCard()
        {
            // Arrange
            var manager = CreateManager();
            var card = CreateTestCard("1234567890123456", 1000.0);

            // Act
            var result = manager.Update(card.Guid, "Jane", "Smith", null, null, null, 2000.0);

            // Assert
            Assert.True(result.Success);
            var updated = CardRepository.GetById(card.Guid);
            Assert.Equal("Jane", updated!.HolderFirstName);
            Assert.Equal("Smith", updated.HolderLastName);
            Assert.Equal(2000.0, updated.Balance);
            Assert.Equal("1234567890123456", updated.Number); // Number unchanged
        }

        [Fact]
        public void Update_WithDuplicateCardNumber_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var card1 = CreateTestCard("1111111111111111");
            var card2 = CreateTestCard("2222222222222222");

            // Act
            var result = manager.Update(card1.Guid, null, null, "2222222222222222", null, null, null);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Card with this number already exists", result.Message);
        }

        [Fact]
        public void Update_WithNonExistentCard_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var fakeGuid = Guid.NewGuid();

            // Act
            var result = manager.Update(fakeGuid, "John", "Doe", null, null, null, null);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Card not found", result.Message);
        }

        [Fact]
        public void Delete_WithValidCard_DeletesCard()
        {
            // Arrange
            var manager = CreateManager();
            var card = CreateTestCard();
            DetachEntity(card); // Detach to avoid tracking conflicts

            // Act
            var result = manager.Delete(card.Guid);

            // Assert
            Assert.True(result.Success);
            var deleted = CardRepository.GetById(card.Guid);
            Assert.Null(deleted);
        }

        [Fact]
        public void Delete_WithNonExistentCard_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var fakeGuid = Guid.NewGuid();

            // Act
            var result = manager.Delete(fakeGuid);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Card not found", result.Message);
        }

        [Fact]
        public void GetAll_ReturnsCardsOrderedByExpirationDate()
        {
            // Arrange
            var manager = CreateManager();
            var card1 = CreateTestCard("1111111111111111");
            card1.ExpirationDate = DateTime.UtcNow.AddYears(1);
            CardRepository.Update(card1);
            Context.SaveChanges();

            var card2 = CreateTestCard("2222222222222222");
            card2.ExpirationDate = DateTime.UtcNow.AddYears(3);
            CardRepository.Update(card2);
            Context.SaveChanges();

            var card3 = CreateTestCard("3333333333333333");
            card3.ExpirationDate = DateTime.UtcNow.AddYears(2);
            CardRepository.Update(card3);
            Context.SaveChanges();

            // Act
            var cards = manager.GetAll().ToList();

            // Assert
            Assert.Equal(3, cards.Count);
            Assert.True(cards[0].ExpirationDate >= cards[1].ExpirationDate);
            Assert.True(cards[1].ExpirationDate >= cards[2].ExpirationDate);
        }

        [Fact]
        public void GetByGuid_WithExistingCard_ReturnsCard()
        {
            // Arrange
            var manager = CreateManager();
            var card = CreateTestCard();

            // Act
            var result = manager.GetByGuid(card.Guid);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(card.Guid, result.Guid);
        }

        [Fact]
        public void GetByGuid_WithNonExistentCard_ReturnsNull()
        {
            // Arrange
            var manager = CreateManager();
            var fakeGuid = Guid.NewGuid();

            // Act
            var result = manager.GetByGuid(fakeGuid);

            // Assert
            Assert.Null(result);
        }
    }
}

