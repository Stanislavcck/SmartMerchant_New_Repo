using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/card")]
    public class CardController : ControllerBase
    {
        private readonly CardManager _cardManager;
        private readonly AuthorizationManager _authorizationManager;

        public CardController(CardManager cardManager, AuthorizationManager authorizationManager)
        {
            _cardManager = cardManager;
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

        [HttpGet("")]
        public IActionResult GetAll()
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var cards = _cardManager.GetAll();

            return Ok(new
            {
                success = true,
                cards = cards.Select(c => new
                {
                    guid = c.Guid,
                    holderFirstName = c.HolderFirstName,
                    holderLastName = c.HolderLastName,
                    number = c.Number,
                    expiry = c.ExpirationDate.ToString("MM/yy"),
                    cvv = c.CVV,
                    balance = c.Balance
                })
            });
        }

        [HttpGet("{cardGuid}")]
        public IActionResult GetById(Guid cardGuid)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var card = _cardManager.GetByGuid(cardGuid);
            if (card == null)
            {
                return NotFound(new { success = false, message = "Card not found" });
            }

            return Ok(new
            {
                success = true,
                card = new
                {
                    guid = card.Guid,
                    holderFirstName = card.HolderFirstName,
                    holderLastName = card.HolderLastName,
                    number = card.Number,
                    expiry = card.ExpirationDate.ToString("MM/yy"),
                    cvv = card.CVV,
                    balance = card.Balance
                }
            });
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateCardRequest request)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            if (string.IsNullOrWhiteSpace(request.HolderFirstName) || string.IsNullOrWhiteSpace(request.HolderLastName))
            {
                return BadRequest(new { success = false, message = "Holder first name and last name are required" });
            }

            if (string.IsNullOrWhiteSpace(request.Number))
            {
                return BadRequest(new { success = false, message = "Card number is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Expiry) || !DateTime.TryParseExact($"01/{request.Expiry}", "dd/MM/yy", null, System.Globalization.DateTimeStyles.None, out var expirationDate))
            {
                return BadRequest(new { success = false, message = "Valid expiry date (MM/yy) is required" });
            }

            // Set to last day of the month
            expirationDate = new DateTime(expirationDate.Year, expirationDate.Month, DateTime.DaysInMonth(expirationDate.Year, expirationDate.Month));

            var result = _cardManager.Create(
                request.HolderFirstName,
                request.HolderLastName,
                request.Number,
                expirationDate,
                request.CVV ?? string.Empty,
                request.Balance ?? 0.0
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    cardGuid = result.CardGuid
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPut("edit/{cardGuid}")]
        public IActionResult Edit(Guid cardGuid, [FromBody] EditCardRequest request)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            DateTime? expirationDate = null;
            if (!string.IsNullOrWhiteSpace(request.Expiry))
            {
                if (DateTime.TryParseExact($"01/{request.Expiry}", "dd/MM/yy", null, System.Globalization.DateTimeStyles.None, out var expDate))
                {
                    expirationDate = new DateTime(expDate.Year, expDate.Month, DateTime.DaysInMonth(expDate.Year, expDate.Month));
                }
                else
                {
                    return BadRequest(new { success = false, message = "Invalid expiry date format (MM/yy)" });
                }
            }

            var result = _cardManager.Update(
                cardGuid,
                request.HolderFirstName,
                request.HolderLastName,
                request.Number,
                expirationDate,
                request.CVV,
                request.Balance
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

        [HttpDelete("{cardGuid}")]
        public IActionResult Delete(Guid cardGuid)
        {
            var session = ValidateToken();
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Authorization token is required" });
            }

            var result = _cardManager.Delete(cardGuid);

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
    }

    public class CreateCardRequest
    {
        public string HolderFirstName { get; set; } = string.Empty;
        public string HolderLastName { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string Expiry { get; set; } = string.Empty; // MM/yy format
        public string? CVV { get; set; }
        public double? Balance { get; set; }
    }

    public class EditCardRequest
    {
        public string? HolderFirstName { get; set; }
        public string? HolderLastName { get; set; }
        public string? Number { get; set; }
        public string? Expiry { get; set; } // MM/yy format
        public string? CVV { get; set; }
        public double? Balance { get; set; }
    }
}

