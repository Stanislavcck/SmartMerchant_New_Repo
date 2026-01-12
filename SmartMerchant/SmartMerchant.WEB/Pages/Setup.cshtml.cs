using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SmartMerchant.WEB.Pages
{
    public class SetupModel : PageModel
    {
        [BindProperty]
        public string MerchantName { get; set; } = string.Empty;

        [BindProperty]
        public string Description { get; set; } = string.Empty;

        [BindProperty]
        public string LogoUrl { get; set; } = string.Empty;

        public void OnGet()
        {
        }

        public IActionResult OnPost()
        {
            // TODO: Implement merchant setup logic
            // For now, redirect to admin dashboard
            return RedirectToPage("/Admin/Main");
        }
    }
}

