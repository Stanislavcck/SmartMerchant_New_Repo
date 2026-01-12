using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/authorization")]
    public class AuthorizationController : ControllerBase
    {
        private readonly AuthorizationManager _authorizationManager;

        public AuthorizationController(AuthorizationManager authorizationManager)
        {
            _authorizationManager = authorizationManager;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FirstName) ||
                string.IsNullOrWhiteSpace(request.LastName) ||
                string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "All required fields must be provided" });
            }

            if (request.Password.Length < 12)
            {
                return BadRequest(new { success = false, message = "Password must be at least 12 characters" });
            }

            var result = _authorizationManager.Register(
                request.FirstName,
                request.LastName,
                request.MiddleName,
                request.Username,
                request.Password
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    userGuid = result.UserGuid
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { success = false, message = "Username and password are required" });
            }

            var result = _authorizationManager.Login(request.Username, request.Password);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    token = result.Token,
                    userGuid = result.UserGuid
                });
            }

            return Unauthorized(new { success = false, message = result.Message });
        }

        [HttpGet("user")]
        public IActionResult GetUser([FromHeader(Name = "Authorization")] string? token)
        {
            // Try to get token from header, cookie, or query
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Cookies["authToken"];
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Query["token"].FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired session" });
            }

            var user = _authorizationManager.GetUserByGuid(session.UserGuid);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            return Ok(new
            {
                success = true,
                user = new
                {
                    guid = user.Guid,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    middleName = user.MiddleName,
                    username = user.Username
                }
            });
        }

        [HttpPut("user")]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest request, [FromHeader(Name = "Authorization")] string? token)
        {
            // Try to get token from header, cookie, or query
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Cookies["authToken"];
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Query["token"].FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired session" });
            }

            var result = _authorizationManager.UpdateUser(
                session.UserGuid,
                request.FirstName,
                request.LastName,
                request.MiddleName,
                request.Username
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPost("user/change-password")]
        public IActionResult ChangePassword([FromBody] ChangePasswordRequest request, [FromHeader(Name = "Authorization")] string? token)
        {
            // Try to get token from header, cookie, or query
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Cookies["authToken"];
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Query["token"].FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired session" });
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { success = false, message = "Current password and new password are required" });
            }

            var result = _authorizationManager.ChangePassword(
                session.UserGuid,
                request.CurrentPassword,
                request.NewPassword
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Try to get token from header, cookie, or query
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Cookies["authToken"];
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                token = Request.Query["token"].FirstOrDefault();
            }

            // Even if no token, return success (idempotent)
            if (!string.IsNullOrWhiteSpace(token))
            {
                _authorizationManager.Logout(token);
            }

            // Clear cookie
            Response.Cookies.Delete("authToken");

            return Ok(new
            {
                success = true,
                message = "Logged out successfully"
            });
        }
    }

    public class RegisterRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleName { get; set; }
        public string? Username { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}

