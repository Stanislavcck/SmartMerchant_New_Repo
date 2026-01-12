using SmartMerchant.Application;

namespace SmartMerchant.WEB.Middleware
{
    public class MerchantCheckMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<MerchantCheckMiddleware> _logger;

        public MerchantCheckMiddleware(RequestDelegate next, ILogger<MerchantCheckMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, AuthorizationManager authorizationManager, MerchantManager merchantManager)
        {
            // Skip middleware for certain paths
            var path = context.Request.Path.Value?.ToLower() ?? "";
            if (path.StartsWith("/api/") || 
                path.StartsWith("/merchant/create") || 
                path.StartsWith("/login") || 
                path.StartsWith("/register") ||
                path.StartsWith("/error") ||
                path == "/" ||
                path.StartsWith("/index") ||
                path.StartsWith("/features") ||
                path.StartsWith("/pricing") ||
                path.StartsWith("/privacy") ||
                path.StartsWith("/terms") ||
                path.StartsWith("/_") ||
                path.StartsWith("/swagger") ||
                path.StartsWith("/css") ||
                path.StartsWith("/js") ||
                path.StartsWith("/lib") ||
                path.StartsWith("/favicon"))
            {
                await _next(context);
                return;
            }

            // Check if user is authenticated via token
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "") 
                       ?? context.Request.Cookies["authToken"]
                       ?? context.Request.Query["token"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(token))
            {
                await _next(context);
                return;
            }

            // Validate session
            var session = authorizationManager.ValidateSession(token);
            if (session == null)
            {
                // Session invalid or expired - clear cookie and redirect to login
                context.Response.Cookies.Delete("authToken");
                if (path.StartsWith("/admin") || path.StartsWith("/merchant"))
                {
                    context.Response.Redirect("/Login");
                    return;
                }
                await _next(context);
                return;
            }

            // Check if user still exists
            var user = authorizationManager.GetUserByGuid(session.UserGuid);
            if (user == null)
            {
                // User not found - logout and redirect to login
                authorizationManager.Logout(token);
                context.Response.Cookies.Delete("authToken");
                if (path.StartsWith("/admin") || path.StartsWith("/merchant"))
                {
                    context.Response.Redirect("/Login");
                    return;
                }
                await _next(context);
                return;
            }

            // Check if user has a merchant
            var merchant = merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null && path.StartsWith("/admin"))
            {
                // User doesn't have a merchant, redirect to create merchant page
                context.Response.Redirect("/Merchant/Create");
                return;
            }

            await _next(context);
        }
    }

    public static class MerchantCheckMiddlewareExtensions
    {
        public static IApplicationBuilder UseMerchantCheck(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<MerchantCheckMiddleware>();
        }
    }
}

