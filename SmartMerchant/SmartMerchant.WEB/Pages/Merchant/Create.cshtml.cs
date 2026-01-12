using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using SmartMerchant.Application;

namespace SmartMerchant.WEB.Pages.Merchant
{
    public class CreateModel : PageModel
    {
        private readonly AuthorizationManager _authorizationManager;
        private readonly MerchantManager _merchantManager;

        public CreateModel(AuthorizationManager authorizationManager, MerchantManager merchantManager)
        {
            _authorizationManager = authorizationManager;
            _merchantManager = merchantManager;
        }

        [BindProperty]
        [Required(ErrorMessage = "Merchant name is required")]
        [Display(Name = "Merchant Name")]
        public string MerchantName { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "Description is required")]
        [Display(Name = "Description")]
        public string Description { get; set; } = string.Empty;

        [BindProperty]
        [Display(Name = "Logo URL")]
        [Url(ErrorMessage = "Please enter a valid URL")]
        public string LogoUrl { get; set; } = string.Empty;

        public IActionResult OnGet()
        {
            // Check if user is authenticated
            var token = Request.Cookies["authToken"] 
                       ?? Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "")
                       ?? Request.Query["token"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(token))
            {
                return RedirectToPage("/Login");
            }

            // Validate session
            var session = _authorizationManager.ValidateSession(token);
            if (session == null)
            {
                return RedirectToPage("/Login");
            }

            // Check if user already has a merchant
            var existingMerchant = _merchantManager.GetByUserGuid(session.UserGuid);
            if (existingMerchant != null)
            {
                // User already has a merchant, redirect to admin
                return RedirectToPage("/Admin/Main");
            }

            return Page();
        }

        public IActionResult OnPost()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            // TODO: Implement merchant creation logic
            // For now, redirect to admin main
            return RedirectToPage("/Admin/Main");
        }
    }
}

