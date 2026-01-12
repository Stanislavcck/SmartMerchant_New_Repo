using SmartMerchant.Domain;

namespace SmartMerchant.Application
{
    public class CardManager
    {
        private readonly DatabaseContext _context;
        private readonly IRepository<CreditCard> _cardRepository;

        public CardManager(DatabaseContext context, IRepository<CreditCard> cardRepository)
        {
            _context = context;
            _cardRepository = cardRepository;
        }

        public CreditCard? GetByGuid(Guid cardGuid)
        {
            return _cardRepository.Query().FirstOrDefault(c => c.Guid == cardGuid);
        }

        public CreditCard? GetByGuidWithTracking(Guid cardGuid)
        {
            // Get card with tracking for updates
            var card = _cardRepository.GetById(cardGuid);
            if (card != null)
            {
                // Ensure entity is tracked
                _context.Entry(card).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
            }
            return card;
        }

        public IEnumerable<CreditCard> GetAll()
        {
            return _cardRepository.Query().OrderByDescending(c => c.ExpirationDate).ToList();
        }

        public CreateCardResult Create(string holderFirstName, string holderLastName, string number, DateTime expirationDate, string cvv, double balance)
        {
            if (string.IsNullOrWhiteSpace(holderFirstName) || string.IsNullOrWhiteSpace(holderLastName))
            {
                return new CreateCardResult
                {
                    Success = false,
                    Message = "Holder first name and last name are required"
                };
            }

            if (string.IsNullOrWhiteSpace(number) || number.Length < 13)
            {
                return new CreateCardResult
                {
                    Success = false,
                    Message = "Valid card number is required"
                };
            }

            if (string.IsNullOrWhiteSpace(cvv) || cvv.Length < 3)
            {
                return new CreateCardResult
                {
                    Success = false,
                    Message = "Valid CVV is required"
                };
            }

            // Check if card number already exists
            var existingCard = _cardRepository.Query().FirstOrDefault(c => c.Number == number);
            if (existingCard != null)
            {
                return new CreateCardResult
                {
                    Success = false,
                    Message = "Card with this number already exists"
                };
            }

            var card = new CreditCard
            {
                Guid = Guid.NewGuid(),
                HolderFirstName = holderFirstName,
                HolderLastName = holderLastName,
                Number = number,
                ExpirationDate = expirationDate,
                CVV = cvv,
                Balance = balance
            };

            _cardRepository.Add(card);
            _context.SaveChanges();

            return new CreateCardResult
            {
                Success = true,
                Message = "Card created successfully",
                CardGuid = card.Guid
            };
        }

        public UpdateCardResult Update(Guid cardGuid, string? holderFirstName, string? holderLastName, string? number, DateTime? expirationDate, string? cvv, double? balance)
        {
            // Get card with tracking for updates
            var card = GetByGuidWithTracking(cardGuid);
            if (card == null)
            {
                return new UpdateCardResult
                {
                    Success = false,
                    Message = "Card not found"
                };
            }

            if (!string.IsNullOrWhiteSpace(holderFirstName))
            {
                card.HolderFirstName = holderFirstName;
            }

            if (!string.IsNullOrWhiteSpace(holderLastName))
            {
                card.HolderLastName = holderLastName;
            }

            if (!string.IsNullOrWhiteSpace(number))
            {
                // Check if new number already exists (and is not the current card's number)
                var existingCard = _cardRepository.Query().FirstOrDefault(c => c.Number == number && c.Guid != cardGuid);
                if (existingCard != null)
                {
                    return new UpdateCardResult
                    {
                        Success = false,
                        Message = "Card with this number already exists"
                    };
                }
                card.Number = number;
            }

            if (expirationDate.HasValue)
            {
                card.ExpirationDate = expirationDate.Value;
            }

            if (!string.IsNullOrWhiteSpace(cvv))
            {
                card.CVV = cvv;
            }

            if (balance.HasValue)
            {
                card.Balance = balance.Value;
            }

            _cardRepository.Update(card);
            _context.SaveChanges();

            return new UpdateCardResult
            {
                Success = true,
                Message = "Card updated successfully"
            };
        }

        public DeleteCardResult Delete(Guid cardGuid)
        {
            var card = GetByGuid(cardGuid);
            if (card == null)
            {
                return new DeleteCardResult
                {
                    Success = false,
                    Message = "Card not found"
                };
            }

            _cardRepository.Delete(card);
            _context.SaveChanges();

            return new DeleteCardResult
            {
                Success = true,
                Message = "Card deleted successfully"
            };
        }
    }

    public class CreateCardResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? CardGuid { get; set; }
    }

    public class UpdateCardResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class DeleteCardResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

