using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using System.Security.Claims;
using Auth0.AspNetCore.Authentication;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/okta")]
    public class OktaController : ControllerBase
    {
        private readonly AuthorizationManager _authorizationManager;
        private readonly ILogger<OktaController> _logger;

        public OktaController(AuthorizationManager authorizationManager, ILogger<OktaController> logger)
        {
            _authorizationManager = authorizationManager;
            _logger = logger;
        }

        [HttpGet("login")]
        public async Task Login()
        {
            // This will redirect to Auth0 login page
            // Auth0 middleware will handle callback at /signin-auth0, then redirect here
            var authenticationProperties = new LoginAuthenticationPropertiesBuilder()
                .WithRedirectUri("/api/okta/sync")
                .Build();

            await HttpContext.ChallengeAsync(Auth0Constants.AuthenticationScheme, authenticationProperties);
        }

        [HttpGet("sync")]
        [Authorize(AuthenticationSchemes = "Auth0")]
        public async Task<IActionResult> Sync()
        {
            try
            {
                _logger.LogInformation("Syncing Auth0 user. User authenticated: {IsAuth}, Name: {Name}", 
                    User.Identity?.IsAuthenticated, User.Identity?.Name);
                
                if (!(User.Identity?.IsAuthenticated ?? false))
                {
                    _logger.LogWarning("User is not authenticated");
                    return Redirect("/Login?error=authentication_failed");
                }
                
                // Get user claims from the authenticated user
                var claims = User.Claims.ToList();
                _logger.LogInformation("User has {Count} claims. Claims: {Claims}", 
                    claims.Count, string.Join(", ", claims.Select(c => $"{c.Type}={c.Value}")));

                // Try multiple ways to get email - check all possible claim types
                var email = claims.FirstOrDefault(c => 
                    c.Type == ClaimTypes.Email || 
                    c.Type == "email" ||
                    (c.Type == ClaimTypes.Name && c.Value.Contains("@")) ||
                    (c.Type == "name" && c.Value.Contains("@")))?.Value;
                
                // If email not found, try "name" claim (Auth0 sometimes puts email there)
                if (string.IsNullOrEmpty(email))
                {
                    var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name || c.Type == "name")?.Value;
                    if (!string.IsNullOrEmpty(nameClaim) && nameClaim.Contains("@"))
                    {
                        email = nameClaim;
                        _logger.LogInformation("Using 'name' claim as email: {Email}", email);
                    }
                }
                
                // Extract nickname once for reuse
                var nickname = claims.FirstOrDefault(c => c.Type == "nickname")?.Value;
                
                // If still no email, try nickname or use nameidentifier as username
                if (string.IsNullOrEmpty(email))
                {
                    var nameIdentifier = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                    
                    // Use nickname if available, otherwise generate from nameidentifier
                    if (!string.IsNullOrEmpty(nickname))
                    {
                        email = $"{nickname}@auth0.local";
                        _logger.LogInformation("Using nickname as email base: {Email}", email);
                    }
                    else if (!string.IsNullOrEmpty(nameIdentifier))
                    {
                        // Extract user ID from auth0|userId format
                        var userId = nameIdentifier.Contains("|") ? nameIdentifier.Split('|').Last() : nameIdentifier;
                        email = $"user_{userId}@auth0.local";
                        _logger.LogInformation("Generated email from nameidentifier: {Email}", email);
                    }
                    else
                    {
                        // Last resort: generate a unique email
                        email = $"auth0_user_{Guid.NewGuid().ToString("N")[..8]}@auth0.local";
                        _logger.LogInformation("Generated fallback email: {Email}", email);
                    }
                }

                // Extract name information
                var firstName = claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName || c.Type == "given_name")?.Value;
                var lastName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Surname || c.Type == "family_name")?.Value;
                var fullName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name || c.Type == "name")?.Value;
                
                // If no first/last name, try to parse from full name or use nickname
                if (string.IsNullOrEmpty(firstName) && !string.IsNullOrEmpty(fullName))
                {
                    // If fullName is an email, extract username part
                    if (fullName.Contains("@"))
                    {
                        firstName = fullName.Split('@')[0];
                    }
                    else
                    {
                        var nameParts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (nameParts.Length > 0)
                        {
                            firstName = nameParts[0];
                            if (nameParts.Length > 1)
                            {
                                lastName = string.Join(" ", nameParts.Skip(1));
                            }
                        }
                    }
                }
                
                // Fallback to nickname or default values
                if (string.IsNullOrEmpty(firstName))
                {
                    firstName = !string.IsNullOrEmpty(nickname) ? nickname : "Auth0";
                }
                if (string.IsNullOrEmpty(lastName))
                {
                    lastName = "User";
                }

                var auth0UserId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation("Extracted email: {Email}, FirstName: {FirstName}, LastName: {LastName}", 
                    email, firstName, lastName);

                // Find or create user in local database
                var user = _authorizationManager.GetUserByUsername(email);
                if (user == null)
                {
                    // Create new user from Auth0
                    var registerResult = _authorizationManager.Register(
                        firstName,
                        lastName,
                        null,
                        email,
                        Guid.NewGuid().ToString() // Random password (not used for Auth0 users)
                    );

                    if (!registerResult.Success)
                    {
                        _logger.LogError($"Failed to create user: {registerResult.Message}");
                        return Redirect("/Login?error=user_creation_failed");
                    }

                    user = _authorizationManager.GetUserByGuid(registerResult.UserGuid!.Value);
                    if (user == null)
                    {
                        _logger.LogError("User was created but could not be retrieved");
                        return Redirect("/Login?error=user_retrieval_failed");
                    }
                }

                // Create local session token
                var loginResult = _authorizationManager.CreateSessionForUser(user.Guid);
                
                if (!loginResult.Success)
                {
                    _logger.LogError($"Failed to create session: {loginResult.Message}");
                    return Redirect("/Login?error=session_creation_failed");
                }

                // Sign in with cookie authentication
                var cookieClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Guid.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, email),
                    new Claim("Token", loginResult.Token!)
                };

                var claimsIdentity = new ClaimsIdentity(cookieClaims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                // Store token in cookie for API access
                Response.Cookies.Append("authToken", loginResult.Token!, new CookieOptions
                {
                    HttpOnly = false, // Allow JavaScript access
                    Secure = false, // Set to true in production with HTTPS
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.UtcNow.AddDays(30)
                });

                // Store token in localStorage via JavaScript redirect
                return Redirect($"/Admin/Main?oktaToken={loginResult.Token}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Okta callback");
                return Redirect("/Login?error=callback_error");
            }
        }

        [HttpPost("logout")]
        [HttpGet("logout")]
        public async Task<IActionResult> Logout()
        {
            // Clear local session
            var token = Request.Cookies["authToken"];
            if (string.IsNullOrEmpty(token))
            {
                token = Request.Query["token"].FirstOrDefault();
            }
            
            if (!string.IsNullOrEmpty(token))
            {
                _authorizationManager.Logout(token);
            }

            // Sign out from cookie
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Sign out from Auth0
            await HttpContext.SignOutAsync(Auth0Constants.AuthenticationScheme);

            // Clear cookie
            Response.Cookies.Delete("authToken");

            return Ok(new { success = true, message = "Logged out successfully" });
        }
    }
}
