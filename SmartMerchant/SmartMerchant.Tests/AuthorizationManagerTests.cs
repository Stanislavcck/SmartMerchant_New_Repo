using SmartMerchant.Application;
using SmartMerchant.Domain;
using Xunit;

namespace SmartMerchant.Tests
{
    public class AuthorizationManagerTests : TestBase
    {
        private AuthorizationManager CreateManager()
        {
            return new AuthorizationManager(Context, UserRepository, SessionRepository);
        }

        [Fact]
        public void Register_WithValidData_ReturnsSuccess()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Register("John", "Doe", "Middle", "johndoe", "ValidPassword123!");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.UserGuid);
            Assert.Equal("User registered successfully", result.Message);
        }

        [Fact]
        public void Register_WithDuplicateUsername_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            CreateTestUser("johndoe");

            // Act
            var result = manager.Register("John", "Doe", null, "johndoe", "ValidPassword123!");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Username already exists", result.Message);
        }

        [Fact]
        public void Login_WithValidCredentials_ReturnsSuccess()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser("johndoe", "ValidPassword123!");

            // Act
            var result = manager.Login("johndoe", "ValidPassword123!");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Token);
            Assert.Equal(user.Guid, result.UserGuid);
            Assert.Equal("Login successful", result.Message);
        }

        [Fact]
        public void Login_WithInvalidUsername_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();

            // Act
            var result = manager.Login("nonexistent", "Password123!");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Invalid username or password", result.Message);
        }

        [Fact]
        public void Login_WithInvalidPassword_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            CreateTestUser("johndoe", "ValidPassword123!");

            // Act
            var result = manager.Login("johndoe", "WrongPassword123!");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Invalid username or password", result.Message);
        }

        [Fact]
        public void ValidateSession_WithValidToken_ReturnsSession()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var loginResult = manager.Login(user.Username, "TestPassword123!");

            // Act
            var session = manager.ValidateSession(loginResult.Token!);

            // Assert
            Assert.NotNull(session);
            Assert.Equal(user.Guid, session.UserGuid);
        }

        [Fact]
        public void ValidateSession_WithExpiredToken_ReturnsNull()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var loginResult = manager.Login(user.Username, "TestPassword123!");
            
            // Expire the session - get it with tracking from context directly
            var trackedSession = Context.Set<UserSession>().First(s => s.Token == loginResult.Token);
            trackedSession.ExpireAt = DateTime.UtcNow.AddDays(-1);
            Context.SaveChanges();
            DetachEntity(trackedSession); // Detach to avoid tracking conflicts

            // Act
            var result = manager.ValidateSession(loginResult.Token!);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void Logout_WithValidToken_RemovesSession()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser();
            var loginResult = manager.Login(user.Username, "TestPassword123!");
            // Clear any tracked entities
            Context.ChangeTracker.Clear();

            // Act
            var result = manager.Logout(loginResult.Token!);

            // Assert
            Assert.True(result.Success);
            var session = SessionRepository.Query().FirstOrDefault(s => s.Token == loginResult.Token);
            Assert.Null(session);
        }

        [Fact]
        public void UpdateUser_WithValidData_UpdatesUser()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser("oldusername");
            DetachEntity(user); // Detach to avoid tracking conflicts

            // Act
            var result = manager.UpdateUser(user.Guid, "NewFirst", "NewLast", "NewMiddle", "newusername");

            // Assert
            Assert.True(result.Success);
            var updatedUser = UserRepository.GetById(user.Guid);
            Assert.Equal("NewFirst", updatedUser!.FirstName);
            Assert.Equal("NewLast", updatedUser.LastName);
            Assert.Equal("NewMiddle", updatedUser.MiddleName);
            Assert.Equal("newusername", updatedUser.Username);
        }

        [Fact]
        public void UpdateUser_WithDuplicateUsername_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");

            // Act
            var result = manager.UpdateUser(user1.Guid, null, null, null, "user2");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Username already exists", result.Message);
        }

        [Fact]
        public void ChangePassword_WithValidCurrentPassword_UpdatesPassword()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser("testuser", "OldPassword123!");
            DetachEntity(user); // Detach to avoid tracking conflicts

            // Act
            var result = manager.ChangePassword(user.Guid, "OldPassword123!", "NewPassword123!");

            // Assert
            Assert.True(result.Success);
            var updatedUser = UserRepository.GetById(user.Guid);
            Assert.NotNull(updatedUser);
            // Verify new password works
            var loginResult = manager.Login("testuser", "NewPassword123!");
            Assert.True(loginResult.Success);
        }

        [Fact]
        public void ChangePassword_WithInvalidCurrentPassword_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser("testuser", "OldPassword123!");

            // Act
            var result = manager.ChangePassword(user.Guid, "WrongPassword123!", "NewPassword123!");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Current password is incorrect", result.Message);
        }

        [Fact]
        public void ChangePassword_WithShortPassword_ReturnsFailure()
        {
            // Arrange
            var manager = CreateManager();
            var user = CreateTestUser("testuser", "OldPassword123!");

            // Act
            var result = manager.ChangePassword(user.Guid, "OldPassword123!", "Short123!");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("New password must be at least 12 characters", result.Message);
        }
    }
}

