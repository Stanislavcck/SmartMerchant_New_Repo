using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/invoice")]
    public class InvoiceController : ControllerBase
    {
        private readonly InvoiceManager _invoiceManager;
        private readonly AuthorizationManager _authorizationManager;
        private readonly MerchantManager _merchantManager;

        public InvoiceController(InvoiceManager invoiceManager, AuthorizationManager authorizationManager, MerchantManager merchantManager)
        {
            _invoiceManager = invoiceManager;
            _authorizationManager = authorizationManager;
            _merchantManager = merchantManager;
        }

        private string? GetToken()
        {
            return Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "")
                   ?? Request.Cookies["authToken"]
                   ?? Request.Query["token"].FirstOrDefault();
        }

        private UserSession? ValidateToken()
        {
            var token = GetToken();
            if (string.IsNullOrWhiteSpace(token))
            {
                return null;
            }
            return _authorizationManager.ValidateSession(token);
        }

        [HttpGet("")]
        public IActionResult Get([FromQuery] Guid? merchantGuid, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            // Get merchant for user
            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            // Use provided merchantGuid or default to user's merchant
            var targetMerchantGuid = merchantGuid ?? merchant.Guid;

            // Verify ownership if different merchantGuid provided
            if (merchantGuid.HasValue && merchantGuid.Value != merchant.Guid)
            {
                var targetMerchant = _merchantManager.GetByGuid(targetMerchantGuid);
                if (targetMerchant == null || targetMerchant.OwnerUserGuid != session.UserGuid)
                {
                    return Forbid();
                }
            }

            var (invoices, totalCount) = _invoiceManager.GetByMerchantGuid(targetMerchantGuid, page, pageSize);

            return Ok(new
            {
                success = true,
                invoices = invoices.Select(i => new
                {
                    guid = i.Guid,
                    number = i.Number,
                    amount = i.Amount,
                    description = i.Description,
                    createdAt = i.CreatedAt.ToString("yyyy-MM-dd"),
                    dueAt = i.DueAt.ToString("yyyy-MM-dd"),
                    isPaid = i.IsPaid,
                    paidBy = i.PaidBy
                }),
                pagination = new
                {
                    page = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        [HttpGet("{invoiceGuid}")]
        public IActionResult GetById(Guid invoiceGuid)
        {
            // Allow public access for payment pages (no auth required)
            var invoice = _invoiceManager.GetByGuid(invoiceGuid);
            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Invoice not found" });
            }

            // If token is provided, verify ownership (for merchant access)
            var session = ValidateToken();
            if (session != null)
            {
                var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
                if (merchant != null && invoice.MerchantGuid != merchant.Guid)
                {
                    return Forbid();
                }
            }

            return Ok(new
            {
                success = true,
                invoice = new
                {
                    guid = invoice.Guid,
                    number = invoice.Number,
                    amount = invoice.Amount,
                    description = invoice.Description,
                    createdAt = invoice.CreatedAt.ToString("yyyy-MM-dd"),
                    dueAt = invoice.DueAt.ToString("yyyy-MM-dd"),
                    isPaid = invoice.IsPaid,
                    paidBy = invoice.PaidBy,
                    merchantGuid = invoice.MerchantGuid
                }
            });
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateInvoiceRequest request)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            if (request.Amount <= 0)
            {
                return BadRequest(new { success = false, message = "Amount must be greater than 0" });
            }

            // Get merchant for user
            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            DateTime? dueAt = null;
            if (request.DueAt.HasValue)
            {
                dueAt = request.DueAt.Value;
            }

            var result = _invoiceManager.Create(
                merchant.Guid,
                request.Amount,
                request.Description ?? string.Empty,
                dueAt
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    invoiceGuid = result.InvoiceGuid,
                    invoiceNumber = result.InvoiceNumber
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpDelete("{invoiceGuid}")]
        public IActionResult Delete(Guid invoiceGuid)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            // Get merchant for user
            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            var result = _invoiceManager.Delete(invoiceGuid, merchant.Guid);

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

        [HttpPost("{invoiceGuid}/mark-paid")]
        public IActionResult MarkAsPaid(Guid invoiceGuid, [FromBody] MarkPaidRequest request)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            // Get merchant for user
            var merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            var result = _invoiceManager.MarkAsPaid(invoiceGuid, merchant.Guid, request.PaidBy ?? string.Empty);

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

        [HttpPost("pay/{invoiceGuid}")]
        public IActionResult Pay(Guid invoiceGuid, [FromBody] PayInvoiceRequest request)
        {
            var invoice = _invoiceManager.GetByGuid(invoiceGuid);
            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Invoice not found" });
            }

            if (invoice.IsPaid)
            {
                return BadRequest(new { success = false, message = "Invoice is already paid" });
            }

            // Simple payment validation - accept card number starting with 1 for success
            // In production, this would integrate with a payment gateway
            if (string.IsNullOrWhiteSpace(request.CardNumber) || request.CardNumber.Length < 16)
            {
                return BadRequest(new { success = false, message = "Invalid card number" });
            }

            // Simulate payment processing
            // Card starting with "1" succeeds, others fail
            bool paymentSuccess = request.CardNumber.StartsWith("1") && request.CardNumber.Length >= 16;

            if (paymentSuccess)
            {
                var paidBy = $"{request.FirstName} {request.LastName}".Trim();
                var result = _invoiceManager.MarkAsPaid(invoiceGuid, invoice.MerchantGuid, paidBy);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Payment processed successfully"
                    });
                }

                return BadRequest(new { success = false, message = result.Message });
            }
            else
            {
                return BadRequest(new { success = false, message = "Payment declined. Insufficient funds or invalid card." });
            }
        }
    }

    public class CreateInvoiceRequest
    {
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public DateTime? DueAt { get; set; }
    }

    public class MarkPaidRequest
    {
        public string? PaidBy { get; set; }
    }

    public class PayInvoiceRequest
    {
        public string CardNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string Cvv { get; set; } = string.Empty;
    }
}

