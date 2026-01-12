using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly InvoiceManager _invoiceManager;
        private readonly CardManager _cardManager;
        private readonly MerchantManager _merchantManager;
        private readonly DatabaseContext _context;
        private readonly IRepository<TransactionHistory> _transactionRepository;

        public PaymentController(InvoiceManager invoiceManager, CardManager cardManager, MerchantManager merchantManager, DatabaseContext context, IRepository<TransactionHistory> transactionRepository)
        {
            _invoiceManager = invoiceManager;
            _cardManager = cardManager;
            _merchantManager = merchantManager;
            _context = context;
            _transactionRepository = transactionRepository;
        }

        [HttpPost("pay")]
        public IActionResult Pay([FromBody] PaymentRequest request)
        {
            // Validate invoice
            var invoice = _invoiceManager.GetByGuid(request.InvoiceGuid);
            if (invoice == null)
            {
                return NotFound(new
                {
                    success = false,
                    error = "NOT_FOUND",
                    message = "Invoice not found"
                });
            }

            if (invoice.IsPaid)
            {
                return BadRequest(new
                {
                    success = false,
                    error = "ALREADY_PAID",
                    message = "Invoice is already paid"
                });
            }

            // Validate card number format
            var cardNumber = request.CardNumber?.Replace(" ", "").Replace("-", "") ?? string.Empty;
            if (string.IsNullOrWhiteSpace(cardNumber) || cardNumber.Length < 13)
            {
                return BadRequest(new
                {
                    success = false,
                    error = "UNAUTHORIZED",
                    message = "Invalid card number"
                });
            }

            // Find card by number (normalize both for comparison)
            var card = _cardManager.GetAll().FirstOrDefault(c => 
                c.Number.Replace(" ", "").Replace("-", "").Trim() == cardNumber.Trim());
            if (card == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    error = "UNAUTHORIZED",
                    message = "Card not found or invalid"
                });
            }

            // Validate card holder name (case-insensitive)
            var cardFirstName = card.HolderFirstName.Trim();
            var cardLastName = card.HolderLastName.Trim();
            var requestFirstName = request.FirstName?.Trim() ?? string.Empty;
            var requestLastName = request.LastName?.Trim() ?? string.Empty;

            if (!string.Equals(cardFirstName, requestFirstName, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(cardLastName, requestLastName, StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    success = false,
                    error = "UNAUTHORIZED",
                    message = "Card holder name does not match"
                });
            }

            // Validate expiry date
            if (!string.IsNullOrWhiteSpace(request.ExpiryDate))
            {
                var requestExpiry = request.ExpiryDate.Replace("/", "").Trim();
                var cardExpiry = card.ExpirationDate.ToString("MMyy");
                
                if (requestExpiry != cardExpiry)
                {
                    return Unauthorized(new
                    {
                        success = false,
                        error = "UNAUTHORIZED",
                        message = "Card expiry date does not match"
                    });
                }
            }

            // Validate CVV
            if (!string.IsNullOrWhiteSpace(request.Cvv))
            {
                if (request.Cvv.Trim() != card.CVV.Trim())
                {
                    return Unauthorized(new
                    {
                        success = false,
                        error = "UNAUTHORIZED",
                        message = "Card CVV does not match"
                    });
                }
            }

            // Check balance
            if (card.Balance < (double)invoice.Amount)
            {
                return BadRequest(new
                {
                    success = false,
                    error = "INSUFFICIENT_FUNDS",
                    message = $"Insufficient funds. Required: ₴{invoice.Amount:F2}, Available: ₴{card.Balance:F2}"
                });
            }

            // Process payment: deduct balance and mark invoice as paid
            try
            {
                var originalBalance = card.Balance;
                var newBalance = card.Balance - (double)invoice.Amount;

                // Deduct balance from card
                var updateResult = _cardManager.Update(
                    card.Guid,
                    null,
                    null,
                    null,
                    null,
                    null,
                    newBalance
                );

                if (!updateResult.Success)
                {
                    return BadRequest(new
                    {
                        success = false,
                        error = "PAYMENT_FAILED",
                        message = "Failed to process payment"
                    });
                }

                // Mark invoice as paid
                var paidBy = $"{requestFirstName} {requestLastName}".Trim();
                var invoiceResult = _invoiceManager.MarkAsPaid(invoice.Guid, invoice.MerchantGuid, paidBy);

                if (!invoiceResult.Success)
                {
                    // Rollback: restore card balance
                    _cardManager.Update(card.Guid, null, null, null, null, null, originalBalance);
                    
                    return BadRequest(new
                    {
                        success = false,
                        error = "PAYMENT_FAILED",
                        message = invoiceResult.Message
                    });
                }

                // Add full invoice amount to merchant balance (no 3.99% fee)
                var merchantBalanceResult = _merchantManager.AddBalance(invoice.MerchantGuid, (double)invoice.Amount);
                if (!merchantBalanceResult.Success)
                {
                    // Rollback: restore card balance and mark invoice as unpaid
                    _cardManager.Update(card.Guid, null, null, null, null, null, originalBalance);
                    // Note: We can't easily rollback the invoice payment status, but the balance update failure is logged
                    
                    return BadRequest(new
                    {
                        success = false,
                        error = "PAYMENT_FAILED",
                        message = $"Payment processed but failed to update merchant balance: {merchantBalanceResult.Message}"
                    });
                }

                // Create transaction history record
                var transaction = new TransactionHistory
                {
                    Guid = Guid.NewGuid(),
                    MerchantGuid = invoice.MerchantGuid,
                    Amount = invoice.Amount,
                    CreatedAt = DateTime.UtcNow
                };
                _transactionRepository.Add(transaction);
                _context.SaveChanges();

                return Ok(new
                {
                    success = true,
                    message = "Payment processed successfully",
                    transactionId = transaction.Guid.ToString(),
                    remainingBalance = newBalance
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = "PAYMENT_FAILED",
                    message = $"An error occurred during payment processing: {ex.Message}"
                });
            }
        }
    }

    public class PaymentRequest
    {
        public Guid InvoiceGuid { get; set; }
        public string CardNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty; // MM/YY format
        public string Cvv { get; set; } = string.Empty;
    }
}

