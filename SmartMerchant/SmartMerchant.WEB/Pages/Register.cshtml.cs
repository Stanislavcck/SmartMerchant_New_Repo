using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace SmartMerchant.WEB.Pages
{
    public class RegisterModel : PageModel
    {
        [BindProperty]
        [Required(ErrorMessage = "First name is required")]
        [Display(Name = "First Name")]
        public string FirstName { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "Last name is required")]
        [Display(Name = "Last Name")]
        public string LastName { get; set; } = string.Empty;

        [BindProperty]
        [Display(Name = "Middle Name")]
        public string? MiddleName { get; set; }

        [BindProperty]
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        [Display(Name = "Username")]
        public string Username { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 12, ErrorMessage = "Password must be at least 12 characters")]
        [Display(Name = "Password")]
        public string Password { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "Please confirm your password")]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        [Display(Name = "Confirm Password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [BindProperty]
        [Required(ErrorMessage = "You must confirm you are a sole proprietorship")]
        [Display(Name = "I'm sole proprietorship")]
        public bool IsSoleProprietorship { get; set; }

        [BindProperty]
        [Required(ErrorMessage = "You must agree to the terms and conditions")]
        [Display(Name = "Agree to Terms")]
        public bool AgreeToTerms { get; set; }

        public void OnGet()
        {
        }

        public IActionResult OnPost()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            if (!IsSoleProprietorship)
            {
                ModelState.AddModelError("IsSoleProprietorship", "You must confirm you are a sole proprietorship.");
                return Page();
            }

            if (!AgreeToTerms)
            {
                ModelState.AddModelError("AgreeToTerms", "You must agree to the terms and conditions.");
                return Page();
            }

            // TODO: Implement registration logic
            // For now, redirect to merchant create page
            return RedirectToPage("/Merchant/Create");
        }
    }
}

