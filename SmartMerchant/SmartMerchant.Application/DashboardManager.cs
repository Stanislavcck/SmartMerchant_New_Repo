using SmartMerchant.Domain;

namespace SmartMerchant.Application
{
    public class DashboardManager
    {
        private readonly DatabaseContext _context;
        private readonly IRepository<Merchant> _merchantRepository;
        private readonly IRepository<MerchantInvoice> _invoiceRepository;

        public DashboardManager(DatabaseContext context, IRepository<Merchant> merchantRepository, IRepository<MerchantInvoice> invoiceRepository)
        {
            _context = context;
            _merchantRepository = merchantRepository;
            _invoiceRepository = invoiceRepository;
        }

        public DashboardStats GetDashboardStats(Guid merchantGuid)
        {
            var merchant = _merchantRepository.Query().FirstOrDefault(m => m.Guid == merchantGuid);
            if (merchant == null)
            {
                return new DashboardStats();
            }

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            // Current Balance
            var currentBalance = merchant.Balance;

            // Pending Settlements (unpaid invoices)
            var pendingInvoices = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid && !i.IsPaid)
                .ToList();
            var pendingSettlements = pendingInvoices.Sum(i => (double)i.Amount);

            // Today's Transactions (paid invoices today)
            var todayPaidInvoices = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid && i.IsPaid && i.CreatedAt.Date == today)
                .ToList();
            var todayTransactionsCount = todayPaidInvoices.Count;

            // Yesterday's transactions for comparison
            var yesterdayPaidInvoices = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid && i.IsPaid && i.CreatedAt.Date == yesterday)
                .ToList();
            var yesterdayTransactionsCount = yesterdayPaidInvoices.Count;

            // Success Rate (all paid invoices / all invoices)
            var allInvoices = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid)
                .ToList();
            var paidInvoices = allInvoices.Where(i => i.IsPaid).ToList();
            var successRate = allInvoices.Count > 0 
                ? (double)paidInvoices.Count / allInvoices.Count * 100 
                : 100.0;

            // Calculate balance change percentage (simplified - compare today's total vs yesterday's total)
            var todayTotal = todayPaidInvoices.Sum(i => (double)i.Amount);
            var yesterdayTotal = yesterdayPaidInvoices.Sum(i => (double)i.Amount);
            var balanceChangePercent = yesterdayTotal > 0 
                ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
                : 0.0;

            // Chargeback Risk (static for now, can be calculated based on declined payments in future)
            var chargebackRisk = 0.02; // Very low risk

            return new DashboardStats
            {
                CurrentBalance = currentBalance,
                PendingSettlements = pendingSettlements,
                TodayTransactionsCount = todayTransactionsCount,
                SuccessRate = successRate,
                ChargebackRisk = chargebackRisk,
                BalanceChangePercent = balanceChangePercent
            };
        }

        public List<RecentTransaction> GetRecentTransactions(Guid merchantGuid, int limit = 10)
        {
            var recentPaidInvoices = _invoiceRepository.Query()
                .Where(i => i.MerchantGuid == merchantGuid && i.IsPaid)
                .OrderByDescending(i => i.CreatedAt)
                .Take(limit)
                .ToList();

            return recentPaidInvoices.Select(invoice => new RecentTransaction
            {
                InvoiceGuid = invoice.Guid,
                OrderId = invoice.Number,
                Customer = invoice.PaidBy,
                Amount = invoice.Amount,
                Status = "Success",
                Timestamp = invoice.CreatedAt
            }).ToList();
        }
    }

    public class DashboardStats
    {
        public double CurrentBalance { get; set; }
        public double PendingSettlements { get; set; }
        public int TodayTransactionsCount { get; set; }
        public double SuccessRate { get; set; }
        public double ChargebackRisk { get; set; }
        public double BalanceChangePercent { get; set; }
    }

    public class RecentTransaction
    {
        public Guid InvoiceGuid { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}

