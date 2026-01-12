using Microsoft.EntityFrameworkCore;
using SmartMerchant.Domain;
using System.Security.Cryptography;
using System.Text;

namespace SmartMerchant.Application
{
    public class AuthorizationManager
    {
        private readonly DatabaseContext _context;
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<UserSession> _sessionRepository;

        public AuthorizationManager(DatabaseContext context, IRepository<User> userRepository, IRepository<UserSession> sessionRepository)
        {
            _context = context;
            _userRepository = userRepository;
            _sessionRepository = sessionRepository;
        }

        public RegisterResult Register(string firstName, string lastName, string? middleName, string username, string password)
        {
            // Check if username already exists
            var existingUser = _userRepository.Query().FirstOrDefault(u => u.Username == username);
            if (existingUser != null)
            {
                return new RegisterResult
                {
                    Success = false,
                    Message = "Username already exists"
                };
            }

            // Generate password salt
            var salt = GenerateSalt();
            var hashedPassword = HashPassword(password, salt);

            // Create new user
            var user = new User
            {
                Guid = Guid.NewGuid(),
                FirstName = firstName,
                LastName = lastName,
                MiddleName = middleName,
                Username = username,
                Password = hashedPassword,
                PasswordSalt = salt
            };

            _userRepository.Add(user);
            _context.SaveChanges();

            return new RegisterResult
            {
                Success = true,
                Message = "User registered successfully",
                UserGuid = user.Guid
            };
        }

        public LoginResult Login(string username, string password)
        {
            // Find user by username
            var user = _userRepository.Query().FirstOrDefault(u => u.Username == username);
            if (user == null)
            {
                return new LoginResult
                {
                    Success = false,
                    Message = "Invalid username or password"
                };
            }

            // Verify password
            var hashedPassword = HashPassword(password, user.PasswordSalt);
            if (hashedPassword != user.Password)
            {
                return new LoginResult
                {
                    Success = false,
                    Message = "Invalid username or password"
                };
            }

            // Create session
            var session = new UserSession
            {
                Guid = Guid.NewGuid(),
                UserGuid = user.Guid,
                Token = GenerateToken(),
                CreatedAt = DateTime.UtcNow,
                ExpireAt = DateTime.UtcNow.AddDays(30)
            };

            _sessionRepository.Add(session);
            _context.SaveChanges();

            return new LoginResult
            {
                Success = true,
                Message = "Login successful",
                Token = session.Token,
                UserGuid = user.Guid
            };
        }

        public UserSession? ValidateSession(string token)
        {
            var session = _sessionRepository.Query()
                .FirstOrDefault(s => s.Token == token && s.ExpireAt > DateTime.UtcNow);

            return session;
        }

        public LogoutResult Logout(string token)
        {
            var session = _sessionRepository.Query()
                .FirstOrDefault(s => s.Token == token);

            if (session != null)
            {
                _sessionRepository.Delete(session);
                _context.SaveChanges();
            }

            return new LogoutResult
            {
                Success = true,
                Message = "Logged out successfully"
            };
        }

        public User? GetUserByGuid(Guid userGuid)
        {
            return _userRepository.Query().FirstOrDefault(u => u.Guid == userGuid);
        }

        public User? GetUserByUsername(string username)
        {
            return _userRepository.Query().FirstOrDefault(u => u.Username == username);
        }

        public LoginResult CreateSessionForUser(Guid userGuid)
        {
            var user = GetUserByGuid(userGuid);
            if (user == null)
            {
                return new LoginResult
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Create session
            var session = new UserSession
            {
                Guid = Guid.NewGuid(),
                UserGuid = userGuid,
                Token = GenerateToken(),
                CreatedAt = DateTime.UtcNow,
                ExpireAt = DateTime.UtcNow.AddDays(30)
            };

            _sessionRepository.Add(session);
            _context.SaveChanges();

            return new LoginResult
            {
                Success = true,
                Message = "Session created successfully",
                Token = session.Token,
                UserGuid = userGuid
            };
        }

        public UpdateUserResult UpdateUser(Guid userGuid, string? firstName, string? lastName, string? middleName, string? username)
        {
            var user = GetUserByGuid(userGuid);
            if (user == null)
            {
                return new UpdateUserResult
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Check if username is being changed and if it already exists
            if (!string.IsNullOrWhiteSpace(username) && username != user.Username)
            {
                var existingUser = _userRepository.Query().FirstOrDefault(u => u.Username == username);
                if (existingUser != null)
                {
                    return new UpdateUserResult
                    {
                        Success = false,
                        Message = "Username already exists"
                    };
                }
                user.Username = username;
            }

            if (!string.IsNullOrWhiteSpace(firstName))
            {
                user.FirstName = firstName;
            }

            if (!string.IsNullOrWhiteSpace(lastName))
            {
                user.LastName = lastName;
            }

            if (middleName != null)
            {
                user.MiddleName = middleName;
            }

            _userRepository.Update(user);
            _context.SaveChanges();

            return new UpdateUserResult
            {
                Success = true,
                Message = "User updated successfully"
            };
        }

        public ChangePasswordResult ChangePassword(Guid userGuid, string currentPassword, string newPassword)
        {
            var user = GetUserByGuid(userGuid);
            if (user == null)
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify current password
            var hashedCurrentPassword = HashPassword(currentPassword, user.PasswordSalt);
            if (hashedCurrentPassword != user.Password)
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };
            }

            if (newPassword.Length < 12)
            {
                return new ChangePasswordResult
                {
                    Success = false,
                    Message = "New password must be at least 12 characters"
                };
            }

            // Update password
            var newSalt = GenerateSalt();
            var hashedNewPassword = HashPassword(newPassword, newSalt);
            user.Password = hashedNewPassword;
            user.PasswordSalt = newSalt;

            _userRepository.Update(user);
            _context.SaveChanges();

            return new ChangePasswordResult
            {
                Success = true,
                Message = "Password changed successfully"
            };
        }

        private string GenerateSalt()
        {
            var saltBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(saltBytes);
            }
            return Convert.ToBase64String(saltBytes);
        }

        private string HashPassword(string password, string salt)
        {
            using (var sha256 = SHA256.Create())
            {
                var saltedPassword = password + salt;
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private string GenerateToken()
        {
            var tokenBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(tokenBytes);
            }
            return Convert.ToBase64String(tokenBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }

    public class RegisterResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? UserGuid { get; set; }
    }

    public class LoginResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public Guid? UserGuid { get; set; }
    }

    public class UpdateUserResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ChangePasswordResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class LogoutResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

