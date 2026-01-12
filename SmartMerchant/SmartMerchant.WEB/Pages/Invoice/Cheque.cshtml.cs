using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SmartMerchant.WEB.Pages.Invoice
{
    public class ChequeModel : PageModel
    {
        [BindProperty(SupportsGet = true)]
        public string Guid { get; set; } = string.Empty;

        public void OnGet()
        {
        }
    }
}

