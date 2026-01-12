using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardManager _dashboardManager;
        private readonly MerchantManager _merchantManager;
        private readonly AuthorizationManager _authorizationManager;

        public DashboardController(DashboardManager dashboardManager, MerchantManager merchantManager, AuthorizationManager authorizationManager)
        {
            _dashboardManager = dashboardManager;
            _merchantManager = merchantManager;
            _authorizationManager = authorizationManager;
        }

        private UserSession? ValidateToken()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
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
                return null;
            }

            return _authorizationManager.ValidateSession(token);
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            var stats = _dashboardManager.GetDashboardStats(merchant.Guid);

            return Ok(new
            {
                success = true,
                stats = new
                {
                    currentBalance = stats.CurrentBalance,
                    pendingSettlements = stats.PendingSettlements,
                    todayTransactionsCount = stats.TodayTransactionsCount,
                    successRate = stats.SuccessRate,
                    chargebackRisk = stats.ChargebackRisk,
                    balanceChangePercent = stats.BalanceChangePercent
                },
                merchant = new
                {
                    code = merchant.Code,
                    name = merchant.Name
                }
            });
        }

        [HttpGet("transactions")]
        public IActionResult GetRecentTransactions([FromQuery] int limit = 10)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            var transactions = _dashboardManager.GetRecentTransactions(merchant.Guid, limit);

            return Ok(new
            {
                success = true,
                transactions = transactions.Select(t => new
                {
                    invoiceGuid = t.InvoiceGuid,
                    orderId = t.OrderId,
                    customer = t.Customer,
                    amount = t.Amount,
                    status = t.Status,
                    timestamp = t.Timestamp.ToString("yyyy-MM-dd HH:mm:ss"),
                    timeAgo = GetTimeAgo(t.Timestamp)
                })
            });
        }

        private string GetTimeAgo(DateTime timestamp)
        {
            var now = DateTime.UtcNow;
            var timeSpan = now - timestamp;

            if (timeSpan.TotalMinutes < 1)
            {
                return "Just now";
            }
            else if (timeSpan.TotalMinutes < 60)
            {
                var minutes = (int)timeSpan.TotalMinutes;
                return $"{minutes} min ago";
            }
            else if (timeSpan.TotalHours < 24)
            {
                var hours = (int)timeSpan.TotalHours;
                return $"{hours} hour{(hours > 1 ? "s" : "")} ago";
            }
            else
            {
                var days = (int)timeSpan.TotalDays;
                return $"{days} day{(days > 1 ? "s" : "")} ago";
            }
        }
    }
}

