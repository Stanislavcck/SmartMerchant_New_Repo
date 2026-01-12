using Microsoft.EntityFrameworkCore;
using SmartMerchant.Domain;

namespace SmartMerchant.Application
{
    public class MerchantManager
    {
        private readonly DatabaseContext _context;
        private readonly IRepository<Merchant> _merchantRepository;

        public MerchantManager(DatabaseContext context, IRepository<Merchant> merchantRepository)
        {
            _context = context;
            _merchantRepository = merchantRepository;
        }

        public Merchant? GetByGuid(Guid guid)
        {
            return _merchantRepository.GetById(guid);
        }

        public Merchant? GetByUserGuid(Guid userGuid)
        {
            return _merchantRepository.Query()
                .FirstOrDefault(m => m.OwnerUserGuid == userGuid);
        }

        public CreateMerchantResult Create(Guid userGuid, string name, string description, string logoUrl)
        {
            // Check if user already has a merchant
            var existingMerchant = GetByUserGuid(userGuid);
            if (existingMerchant != null)
            {
                return new CreateMerchantResult
                {
                    Success = false,
                    Message = "User already has a merchant. Each user can only have one merchant."
                };
            }

            // Generate merchant code: LM-{Number of merchants in DB}
            var merchantCount = _merchantRepository.Query().Count();
            var code = $"LM-{merchantCount + 1}";

            // Create new merchant
            var merchant = new Merchant
            {
                Guid = Guid.NewGuid(),
                Code = code,
                Name = name,
                Description = description,
                LogoURL = logoUrl,
                Balance = 0.0,
                OwnerUserGuid = userGuid
            };

            _merchantRepository.Add(merchant);
            _context.SaveChanges();

            return new CreateMerchantResult
            {
                Success = true,
                Message = "Merchant created successfully",
                MerchantGuid = merchant.Guid
            };
        }

        public EditMerchantResult Edit(Guid merchantGuid, Guid userGuid, string? code, string? name, string? description, string? logoUrl)
        {
            // Get merchant
            var merchant = GetByGuid(merchantGuid);
            if (merchant == null)
            {
                return new EditMerchantResult
                {
                    Success = false,
                    Message = "Merchant not found"
                };
            }

            // Verify ownership
            if (merchant.OwnerUserGuid != userGuid)
            {
                return new EditMerchantResult
                {
                    Success = false,
                    Message = "You do not have permission to edit this merchant"
                };
            }

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(code))
            {
                // Check if new code already exists (and is not the current merchant's code)
                var existingCode = _merchantRepository.Query().FirstOrDefault(m => m.Code == code && m.Guid != merchantGuid);
                if (existingCode != null)
                {
                    return new EditMerchantResult
                    {
                        Success = false,
                        Message = "Merchant code already exists"
                    };
                }
                merchant.Code = code;
            }

            if (!string.IsNullOrWhiteSpace(name))
            {
                merchant.Name = name;
            }

            if (description != null)
            {
                merchant.Description = description;
            }

            if (logoUrl != null)
            {
                merchant.LogoURL = logoUrl;
            }

            _merchantRepository.Update(merchant);
            _context.SaveChanges();

            return new EditMerchantResult
            {
                Success = true,
                Message = "Merchant updated successfully"
            };
        }

        public AddBalanceResult AddBalance(Guid merchantGuid, double amount)
        {
            // Get merchant with tracking
            var merchant = GetByGuid(merchantGuid);
            if (merchant == null)
            {
                return new AddBalanceResult
                {
                    Success = false,
                    Message = "Merchant not found"
                };
            }

            if (amount <= 0)
            {
                return new AddBalanceResult
                {
                    Success = false,
                    Message = "Amount must be greater than zero"
                };
            }

            // Ensure entity is tracked for update
            _context.Entry(merchant).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
            
            merchant.Balance += amount * ((100 - 3.99) / 100);
            _merchantRepository.Update(merchant);
            _context.SaveChanges();

            return new AddBalanceResult
            {
                Success = true,
                Message = "Balance added successfully",
                NewBalance = merchant.Balance
            };
        }
    }

    public class AddBalanceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public double? NewBalance { get; set; }
    }

    public class CreateMerchantResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? MerchantGuid { get; set; }
    }

    public class EditMerchantResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

