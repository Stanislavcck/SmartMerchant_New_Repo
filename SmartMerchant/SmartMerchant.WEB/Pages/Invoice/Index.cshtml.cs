using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SmartMerchant.WEB.Pages.Invoice
{
    public class IndexModel : PageModel
    {
        [BindProperty(SupportsGet = true)]
        public string Guid { get; set; } = string.Empty;

        public void OnGet()
        {
        }
    }
}

