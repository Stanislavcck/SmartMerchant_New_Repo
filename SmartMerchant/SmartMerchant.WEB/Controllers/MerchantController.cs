using Microsoft.AspNetCore.Mvc;
using SmartMerchant.Application;
using SmartMerchant.Domain;

namespace SmartMerchant.WEB.Controllers
{
    [ApiController]
    [Route("api/merchant")]
    public class MerchantController : ControllerBase
    {
        private readonly MerchantManager _merchantManager;
        private readonly AuthorizationManager _authorizationManager;

        public MerchantController(MerchantManager merchantManager, AuthorizationManager authorizationManager)
        {
            _merchantManager = merchantManager;
            _authorizationManager = authorizationManager;
        }

        [HttpGet("")]
        public IActionResult Get([FromQuery] Guid? guid, [FromHeader(Name = "Authorization")] string? token)
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

            Merchant? merchant = null;

            if (guid.HasValue)
            {
                // Get by merchant GUID - allow public access for payment pages
                merchant = _merchantManager.GetByGuid(guid.Value);
            }
            else
            {
                // Get by user GUID - requires authentication
                if (string.IsNullOrWhiteSpace(token))
                {
                    return Unauthorized(new { success = false, message = "Authorization token is required" });
                }

                var session = _authorizationManager.ValidateSession(token);
                if (session == null)
                {
                    return Unauthorized(new { success = false, message = "Invalid or expired session" });
                }

                merchant = _merchantManager.GetByUserGuid(session.UserGuid);
            }

            if (merchant == null)
            {
                return NotFound(new { success = false, message = "Merchant not found" });
            }

            return Ok(new
            {
                success = true,
                merchant = new
                {
                    guid = merchant.Guid,
                    code = merchant.Code,
                    name = merchant.Name,
                    description = merchant.Description,
                    logoUrl = merchant.LogoURL,
                    balance = merchant.Balance,
                    ownerUserGuid = merchant.OwnerUserGuid
                }
            });
        }

        [HttpPost("create")]
        public IActionResult Create([FromBody] CreateMerchantRequest request, [FromHeader(Name = "Authorization")] string? token)
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

            // Validate session
            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired session" });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, message = "Name is required" });
            }

            var result = _merchantManager.Create(
                session.UserGuid,
                request.Name,
                request.Description ?? string.Empty,
                request.LogoUrl ?? string.Empty
            );

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    merchantGuid = result.MerchantGuid
                });
            }

            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPut("edit/{merchantGuid}")]
        public IActionResult Edit(Guid merchantGuid, [FromBody] EditMerchantRequest request, [FromHeader(Name = "Authorization")] string? token)
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

            // Validate session
            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired session" });
            }

            var result = _merchantManager.Edit(
                merchantGuid,
                session.UserGuid,
                request.Code,
                request.Name,
                request.Description,
                request.LogoUrl
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
    }

    public class CreateMerchantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
    }

    public class EditMerchantRequest
    {
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
    }
}

