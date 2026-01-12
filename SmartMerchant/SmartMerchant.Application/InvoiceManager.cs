using Microsoft.EntityFrameworkCore;
using SmartMerchant.Domain;

namespace SmartMerchant.Application
{
    public class InvoiceManager
    {
        private readonly DatabaseContext _context;
        private readonly IRepository<MerchantInvoice> _invoiceRepository;

        public InvoiceManager(DatabaseContext context, IRepository<MerchantInvoice> invoiceRepository)
        {
            _context = context;
            _invoiceRepository = invoiceRepository;
        }

        public MerchantInvoice? GetByGuid(Guid guid)
        {
            return _invoiceRepository.GetById(guid);
        }

        public MerchantInvoice? GetByNumber(string number)
        {
            return _invoiceRepository.Query()
                .FirstOrDefault(i => i.Number == number);
        }

        public (List<MerchantInvoice> Invoices, int TotalCount) GetByMerchantGuid(Guid merchantGuid, int page = 1, int pageSize = 10)
        {
            var query = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid)
                .OrderByDescending(i => i.CreatedAt);

            var totalCount = query.Count();
            var invoices = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (invoices, totalCount);
        }

        public CreateInvoiceResult Create(Guid merchantGuid, decimal amount, string description, DateTime? dueAt = null)
        {
            // Generate invoice number: INV-{sequential number based on total count}
            var invoiceCount = _invoiceRepository.Query().Count();
            var number = $"INV-{(invoiceCount + 1):D6}";

            // Check if number already exists and find next available
            int attempts = 0;
            while (GetByNumber(number) != null && attempts < 1000)
            {
                invoiceCount++;
                number = $"INV-{(invoiceCount + 1):D6}";
                attempts++;
            }

            if (attempts >= 1000)
            {
                // Fallback: use GUID-based number
                number = $"INV-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}";
            }

            var invoice = new MerchantInvoice
            {
                Guid = Guid.NewGuid(),
                Number = number,
                MerchantGuid = merchantGuid,
                Amount = amount,
                Description = description ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                DueAt = dueAt ?? DateTime.UtcNow.AddDays(7),
                IsPaid = false,
                PaidBy = string.Empty
            };

            _invoiceRepository.Add(invoice);
            _context.SaveChanges();

            return new CreateInvoiceResult
            {
                Success = true,
                Message = "Invoice created successfully",
                InvoiceGuid = invoice.Guid,
                InvoiceNumber = invoice.Number
            };
        }

        public DeleteInvoiceResult Delete(Guid invoiceGuid, Guid merchantGuid)
        {
            var invoice = GetByGuid(invoiceGuid);
            if (invoice == null)
            {
                return new DeleteInvoiceResult
                {
                    Success = false,
                    Message = "Invoice not found"
                };
            }

            // Verify ownership
            if (invoice.MerchantGuid != merchantGuid)
            {
                return new DeleteInvoiceResult
                {
                    Success = false,
                    Message = "You do not have permission to delete this invoice"
                };
            }

            _invoiceRepository.Delete(invoice);
            _context.SaveChanges();

            return new DeleteInvoiceResult
            {
                Success = true,
                Message = "Invoice deleted successfully"
            };
        }

        public MarkPaidResult MarkAsPaid(Guid invoiceGuid, Guid merchantGuid, string paidBy)
        {
            var invoice = GetByGuid(invoiceGuid);
            if (invoice == null)
            {
                return new MarkPaidResult
                {
                    Success = false,
                    Message = "Invoice not found"
                };
            }

            // Verify ownership
            if (invoice.MerchantGuid != merchantGuid)
            {
                return new MarkPaidResult
                {
                    Success = false,
                    Message = "You do not have permission to modify this invoice"
                };
            }

            invoice.IsPaid = true;
            invoice.PaidBy = paidBy ?? string.Empty;

            _invoiceRepository.Update(invoice);
            _context.SaveChanges();

            return new MarkPaidResult
            {
                Success = true,
                Message = "Invoice marked as paid"
            };
        }
    }

    public class CreateInvoiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? InvoiceGuid { get; set; }
        public string? InvoiceNumber { get; set; }
    }

    public class DeleteInvoiceResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class MarkPaidResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}

